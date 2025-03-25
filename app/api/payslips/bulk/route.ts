import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee, Payslip } from "@/lib/mongodb"

export const maxDuration = 9 // Set max duration to 9 seconds

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

    // Limit the number of payslips to process to avoid timeouts
    const payslipsToProcess = payslips.slice(0, 50)

    // Process each payslip
    const results = await Promise.all(
      payslipsToProcess.map(async (payslipData: any) => {
        try {
          // First, ensure the employee exists
          const employeeData = {
            employeeId: payslipData.employeeId,
            name: payslipData.employeeName, // Use 'name' to match the Employee schema
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
          }).exec()

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
          await Payslip.findOneAndUpdate(
            {
              employeeId: payslipData.employeeId,
              month,
              year,
            },
            payslipRecord,
            { upsert: true, new: true },
          ).exec()

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
    const remaining = payslips.length - payslipsToProcess.length

    return NextResponse.json({
      success: true,
      message: `Processed ${successful} payslips successfully. ${failed} failed. ${remaining > 0 ? `${remaining} payslips were not processed due to time constraints. Please upload them in smaller batches.` : ""}`,
      results,
      processedCount: payslipsToProcess.length,
      totalCount: payslips.length,
    })
  } catch (error) {
    console.error("Error processing bulk payslips:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to process bulk payslips: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

