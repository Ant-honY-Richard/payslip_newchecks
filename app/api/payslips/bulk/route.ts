import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee, Payslip } from "@/lib/mongodb"

export const maxDuration = 30 // Increased to 30 seconds for larger batches

const parseNumeric = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0
  if (typeof value === "number") return value
  const parsed = Number.parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

// We're now directly using the values from the Excel data for all fields
// No need for a separate function to get totals

const numberToWords = (num: number): string => {
  const units = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ]
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

  if (num === 0) return "zero"

  const convertLessThanOneThousand = (n: number): string => {
    if (n < 20) return units[n]
    const digit = n % 10
    if (n < 100) return tens[Math.floor(n / 10)] + (digit ? "-" + units[digit] : "")
    return units[Math.floor(n / 100)] + " hundred" + (n % 100 ? " and " + convertLessThanOneThousand(n % 100) : "")
  }

  let words = ""
  let chunk = 0

  chunk = Math.floor(num / 100000)
  if (chunk > 0) {
    words += convertLessThanOneThousand(chunk) + " lakh"
    if (chunk > 1) words += "s"
    num %= 100000
    if (num > 0) words += " "
  }

  chunk = Math.floor(num / 1000)
  if (chunk > 0) {
    words += convertLessThanOneThousand(chunk) + " thousand"
    num %= 1000
    if (num > 0) words += " "
  }

  if (num > 0) {
    words += convertLessThanOneThousand(num)
  }

  return words + " only"
}

// Generate a random UTR number
const generateUTRNo = () => {
  return `UTR${Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")}`
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { payslips, month, year, clientId } = body

    if (!payslips || !Array.isArray(payslips) || payslips.length === 0) {
      return NextResponse.json({ success: false, error: "No payslips provided or invalid format" }, { status: 400 })
    }
    if (!month || !year) {
      return NextResponse.json({ success: false, error: "Month and year are required" }, { status: 400 })
    }
    if (!clientId) {
      return NextResponse.json({ success: false, error: "Client ID is required" }, { status: 400 })
    }

    // Increase batch size to handle more records
    const batchSize = 100 // Increased from 50
    const totalBatches = Math.ceil(payslips.length / batchSize)
    let processedCount = 0
    let successCount = 0
    let failedCount = 0
    const results = []

    // Process in batches to avoid timeouts
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize
      const endIdx = Math.min(startIdx + batchSize, payslips.length)
      const currentBatch = payslips.slice(startIdx, endIdx)

      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${currentBatch.length} records)`)

      // Process each payslip in the current batch
      const batchResults = await Promise.all(
        currentBatch.map(async (payslipData: any) => {
          try {
            if (!payslipData.employeeId) {
              throw new Error("Employee ID is required")
            }

            // Align with Employee schema (use 'name' instead of 'employeeName')
            const employeeData = {
              employeeId: payslipData.employeeId,
              name: payslipData.employeeName || "", // Changed to 'name'
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
              clientId: clientId || payslipData.clientId,
              updatedAt: new Date(),
            }

            // Generate a UTR number if not provided
            const UTRNo = payslipData.UTRNo || generateUTRNo()

            const processedPayslip = {
              employeeId: payslipData.employeeId,
              month,
              year,
              workingDays: payslipData.workingDays || "",
              extraDays: parseNumeric(payslipData.extraDays),
              otHrs: parseNumeric(payslipData.otHrs),
              arrearsDays: payslipData.arrearsDays || "",
              lop: payslipData.lop || "",
              basic: parseNumeric(payslipData.basic),
              hra: parseNumeric(payslipData.hra),
              specialAllowance: parseNumeric(payslipData.specialAllowance),
              statutoryBonus: parseNumeric(payslipData.statutoryBonus),
              arrearsAmount: parseNumeric(payslipData.arrearsAmount),
              otAmount: parseNumeric(payslipData.otAmount),
              extraHolidayPay: parseNumeric(payslipData.extraHolidayPay),
              attendanceIncentive: parseNumeric(payslipData.attendanceIncentive),
              performanceIncentive: parseNumeric(payslipData.performanceIncentive),
              specialIncentive: parseNumeric(payslipData.specialIncentive),
              // Use deduction values directly from Excel
              professionTax: parseNumeric(payslipData.professionTax),
              pfAmount: parseNumeric(payslipData.pfAmount),
              esic: parseNumeric(payslipData.esic),
              arrearDeduction: parseNumeric(payslipData.arrearDeduction),
              karmaLife: parseNumeric(payslipData.karmaLife),
              // Use total values directly from Excel
              totalGrossA: parseNumeric(payslipData.totalGrossA),
              grossDeductionB: parseNumeric(payslipData.grossDeductionB),
              netTakeHome: parseNumeric(payslipData.netTakeHome),
              netPayWords: payslipData.netPayWords || numberToWords(parseNumeric(payslipData.netTakeHome)),
              clientId: clientId || payslipData.clientId,
              UTRNo,
              updatedAt: new Date(),
            }

            // Update or create employee
            await Employee.findOneAndUpdate(
              { employeeId: payslipData.employeeId },
              { $set: employeeData },
              { upsert: true, new: true },
            ).lean()

            // Update or create payslip
            await Payslip.findOneAndUpdate(
              { employeeId: payslipData.employeeId, month, year },
              { $set: processedPayslip },
              { upsert: true, new: true },
            ).lean()

            successCount++
            return {
              employeeId: payslipData.employeeId,
              success: true,
              message: "Processed successfully",
            }
          } catch (error) {
            console.error(`Error processing payslip for employee ${payslipData.employeeId}:`, error)
            failedCount++
            return {
              employeeId: payslipData.employeeId,
              success: false,
              message: error instanceof Error ? error.message : "Failed to process",
            }
          }
        }),
      )

      results.push(...batchResults)
      processedCount += currentBatch.length
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount} payslips successfully. ${failedCount} failed.`,
      results,
      processedCount,
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

