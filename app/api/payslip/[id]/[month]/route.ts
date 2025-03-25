import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee, Payslip, Client } from "@/lib/mongodb"

export const maxDuration = 9 // Set max duration to 9 seconds

export async function GET(request: NextRequest, { params }: { params: { id: string; month: string } }) {
  try {
    await connectToDatabase()

    const { id, month } = params

    if (!id || !month) {
      return NextResponse.json({ success: false, error: "Employee ID and month are required" }, { status: 400 })
    }

    // Parse month string (format: YYYY-MM)
    const [year, monthNum] = month.split("-")

    if (!year || !monthNum) {
      return NextResponse.json({ success: false, error: "Invalid month format. Expected YYYY-MM" }, { status: 400 })
    }

    // Get employee data - use lean() for better performance
    const employee = await Employee.findOne({ employeeId: id }).lean().exec()

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 })
    }

    // Get payslip data - use lean() for better performance
    const payslip = await Payslip.findOne({
      employeeId: id,
      month: monthNum,
      year,
    })
      .lean()
      .exec()

    if (!payslip) {
      return NextResponse.json({ success: false, error: "Payslip not found for the selected month" }, { status: 404 })
    }

    // Get client data - use lean() for better performance
    let client = null
    if (payslip.clientId) {
      client = await Client.findById(payslip.clientId).lean().exec()
    }

    if (!client) {
      // If no client is associated or client not found, get default client
      client = (await Client.findOne({ isDefault: true }).lean().exec()) || (await Client.findOne({}).lean().exec())
    }

    // Combine employee, payslip, and client data
    const payslipData = {
      // Employee details
      employeeId: employee.employeeId,
      employeeName: employee.name || employee.employeeName, // Support both field names
      mobileNumber: employee.mobileNumber,
      dob: employee.dob,
      doj: employee.doj,
      designation: employee.designation,
      department: employee.department,
      bankName: employee.bankName,
      bankAccountNo: employee.bankAccountNo,
      ifscCode: employee.ifscCode,
      panNo: employee.panNo,
      pfNumber: employee.pfNumber,
      uanNo: employee.uanNo,
      esicNo: employee.esicNo,

      // Payslip details
      workingDays: payslip.workingDays,
      extraDays: payslip.extraDays,
      otHrs: payslip.otHrs,
      arrearsDays: payslip.arrearsDays,
      lop: payslip.lop,

      // Earnings
      basic: payslip.basic,
      hra: payslip.hra,
      specialAllowance: payslip.specialAllowance,
      statutoryBonus: payslip.statutoryBonus,
      arrearsAmount: payslip.arrearsAmount,
      grossEarningsTotal: payslip.grossEarningsTotal,
      otAmount: payslip.otAmount,
      extraHolidayPay: payslip.extraHolidayPay,
      attendanceIncentive: payslip.attendanceIncentive,
      performanceIncentive: payslip.performanceIncentive,
      specialIncentive: payslip.specialIncentive,

      // Deductions
      professionTax: payslip.professionTax,
      pfAmount: payslip.pfAmount,
      esic: payslip.esic,
      arrearDeduction: payslip.arrearDeduction,
      karmaLife: payslip.karmaLife,

      // Totals
      totalGrossA: payslip.totalGrossA,
      grossDeductionB: payslip.grossDeductionB,
      netTakeHome: payslip.netTakeHome,
      netPayWords: payslip.netPayWords,

      // Month and year
      month: payslip.month,
      year: payslip.year,

      // Client details
      clientName: client ? client.name : "ADJ Utility Apps Private Limited",
      clientAddress: client ? client.address : "",
    }

    return NextResponse.json({
      success: true,
      data: payslipData,
    })
  } catch (error) {
    console.error("Error fetching payslip:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch payslip: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

