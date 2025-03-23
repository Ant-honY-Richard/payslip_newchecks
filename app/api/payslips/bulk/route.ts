import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee, Payslip } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { payslips, month, year } = body

    if (!payslips || !Array.isArray(payslips) || payslips.length === 0) {
      return NextResponse.json({ success: false, error: "No payslips provided or invalid format" }, { status: 400 })
    }

    if (!month || !year) {
      return NextResponse.json({ success: false, error: "Month and year are required" }, { status: 400 })
    }

    // Process each payslip
    const results = await Promise.all(
      payslips.map(async (payslipData: any) => {
        try {
          // First, ensure the employee exists
          const employeeData = {
            employeeId: payslipData.employeeId,
            employeeName: payslipData.employeeName,
            mobileNumber: payslipData.mobileNumber || "",
            dob: payslipData.dob || "",
            doj: payslipData.doj || "",
            designation: payslipData.designation || "",
            department: payslipData.department || "",
            bankName: payslipData.bankName || "",
            bankAccountNo: payslipData.bankAccountNo || "",
            ifscCode: payslipData.ifscCode || "",
            panNo: payslipData.panNo || "",
            pfNumber: payslipData.pfNumber || "",
            uanNo: payslipData.uanNo || "",
            esicNo: payslipData.esicNo || "",
            updatedAt: new Date(),
          }

          // Update or create employee
          await Employee.findOneAndUpdate({ employeeId: payslipData.employeeId }, employeeData, {
            upsert: true,
            new: true,
          })

          // Now handle the payslip
          const payslipRecord = {
            employeeId: payslipData.employeeId,
            month,
            year,
            workingDays: payslipData.workingDays || "",
            extraDays: payslipData.extraDays || "",
            otHrs: payslipData.otHrs || "",
            arrearsDays: payslipData.arrearsDays || "",
            lop: payslipData.lop || "",

            // Earnings
            basic: payslipData.basic || "",
            hra: payslipData.hra || "",
            specialAllowance: payslipData.specialAllowance || "",
            statutoryBonus: payslipData.statutoryBonus || "",
            arrearsAmount: payslipData.arrearsAmount || "",
            grossEarningsTotal: payslipData.grossEarningsTotal || "",
            otAmount: payslipData.otAmount || "",
            extraHolidayPay: payslipData.extraHolidayPay || "",
            attendanceIncentive: payslipData.attendanceIncentive || "",
            performanceIncentive: payslipData.performanceIncentive || "",
            specialIncentive: payslipData.specialIncentive || "",

            // Deductions
            professionTax: payslipData.professionTax || "",
            pfAmount: payslipData.pfAmount || "",
            esic: payslipData.esic || "",
            arrearDeduction: payslipData.arrearDeduction || "",
            karmaLife: payslipData.karmaLife || "",

            // Totals
            totalGrossA: payslipData.totalGrossA || "",
            grossDeductionB: payslipData.grossDeductionB || "",
            netTakeHome: payslipData.netTakeHome || "",
            netPayWords: payslipData.netPayWords || "",

            updatedAt: new Date(),
          }

          // Update or create payslip
          const result = await Payslip.findOneAndUpdate(
            {
              employeeId: payslipData.employeeId,
              month,
              year,
            },
            payslipRecord,
            { upsert: true, new: true },
          )

          return {
            employeeId: payslipData.employeeId,
            success: true,
            message: "Processed successfully",
          }
        } catch (error) {
          console.error(`Error processing payslip for employee ${payslipData.employeeId}:`, error)
          return {
            employeeId: payslipData.employeeId,
            success: false,
            message: "Failed to process",
          }
        }
      }),
    )

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Processed ${successful} payslips successfully. ${failed} failed.`,
      results,
    })
  } catch (error) {
    console.error("Error processing bulk payslips:", error)
    return NextResponse.json({ success: false, error: "Failed to process bulk payslips" }, { status: 500 })
  }
}

