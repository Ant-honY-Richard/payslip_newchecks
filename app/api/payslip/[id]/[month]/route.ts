import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee, Payslip, Client } from "@/lib/mongodb"
import { COMPANY_ADDRESS } from "@/lib/company"

export const maxDuration = 9

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

export async function GET(request: NextRequest, { params }: { params: { id: string; month: string } }) {
  try {
    await connectToDatabase()

    const { id, month } = params
    console.log(`Received GET request for employeeId: ${id}, month: ${month}`)

    if (!id || !month) {
      return NextResponse.json({ success: false, error: "Employee ID and month are required" }, { status: 400 })
    }

    const [year, monthNum] = month.split("-")
    if (!year || !monthNum) {
      return NextResponse.json({ success: false, error: "Invalid month format. Expected YYYY-MM" }, { status: 400 })
    }

    const employee = await Employee.findOne({ employeeId: id }).lean().exec()
    console.log(`Fetched employee from DB for ${id}:`, employee)

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 })
    }

    const payslip = await Payslip.findOne({
      employeeId: id,
      month: monthNum,
      year,
    }).lean().exec()
    console.log(`Fetched payslip from DB for ${id}, ${month}:`, payslip)

    if (!payslip) {
      return NextResponse.json({ success: false, error: "Payslip not found for the selected month" }, { status: 404 })
    }

    let client = null
    if (payslip.clientId) {
      client = await Client.findById(payslip.clientId).lean().exec()
    }
    if (!client) {
      client = (await Client.findOne({ isDefault: true }).lean().exec()) || (await Client.findOne({}).lean().exec())
    }
    console.log(`Fetched client for payslip:`, client)

    const payslipData = {
      employeeId: employee.employeeId || id,
      employeeName: employee.employeeName || employee.name || "",
      mobileNumber: employee.mobileNumber || "",
      dob: employee.dob || "",
      doj: employee.doj || employee.joiningDate || "",
      designation: employee.designation || "",
      department: employee.department || "",
      bankName: employee.bankName || "",
      bankAccountNo: employee.bankAccountNo || "",
      ifscCode: employee.ifscCode || "",
      panNo: employee.panNo || "",
      pfNumber: employee.pfNumber || "",
      uanNo: employee.uanNo || "",
      esicNo: employee.esicNo || "",
      workingDays: payslip.workingDays || "",
      extraDays: payslip.extraDays || "",
      otHrs: payslip.otHrs || "",
      arrearsDays: payslip.arrearsDays || "",
      lop: payslip.lop || "",
      basic: payslip.basic || "0",
      hra: payslip.hra || "0",
      specialAllowance: payslip.specialAllowance || "0",
      statutoryBonus: payslip.statutoryBonus || "0",
      arrearsAmount: payslip.arrearsAmount || "0",
      otAmount: payslip.otAmount || "0",
      extraHolidayPay: payslip.extraHolidayPay || "0",
      attendanceIncentive: payslip.attendanceIncentive || "0",
      performanceIncentive: payslip.performanceIncentive || "0",
      specialIncentive: payslip.specialIncentive || "0",
      professionTax: payslip.professionTax || "0",
      pfAmount: payslip.pfAmount || "0",
      esic: payslip.esic || "0",
      arrearDeduction: payslip.arrearDeduction || "0",
      karmaLife: payslip.karmaLife || "0",
      totalGrossA: payslip.totalGrossA || "0", // Direct from stored data
      grossDeductionB: payslip.grossDeductionB || "0", // Direct from stored data
      netTakeHome: payslip.netTakeHome || "0", // Direct from stored data
      netPayWords: payslip.netPayWords || numberToWords(Number(payslip.netTakeHome || "0")),
      UTRNo: payslip.UTRNo || `UTR${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`,
      month: payslip.month || monthNum,
      year: payslip.year || year,
      clientName: client ? client.name : "Newchecks Solutions Pvt. Ltd",
      clientAddress: client ? client.address : COMPANY_ADDRESS,
    }

    console.log(`Returning payslipData for ${id}:`, payslipData)

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

