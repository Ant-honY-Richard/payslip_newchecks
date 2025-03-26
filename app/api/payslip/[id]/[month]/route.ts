import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee, Payslip, Client } from "@/lib/mongodb"

export const maxDuration = 9 // Set max duration to 9 seconds

// Helper function to parse numeric values safely
const parseNumeric = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0
  if (typeof value === "number") return value
  const parsed = Number.parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

// Helper function to calculate totals
const calculateTotals = (payslipData: any) => {
  // Calculate gross earnings
  const basic = parseNumeric(payslipData.basic)
  const hra = parseNumeric(payslipData.hra)
  const specialAllowance = parseNumeric(payslipData.specialAllowance)
  const statutoryBonus = parseNumeric(payslipData.statutoryBonus)
  const arrearsAmount = parseNumeric(payslipData.arrearsAmount)
  const otAmount = parseNumeric(payslipData.otAmount)
  const extraHolidayPay = parseNumeric(payslipData.extraHolidayPay)
  const attendanceIncentive = parseNumeric(payslipData.attendanceIncentive)
  const performanceIncentive = parseNumeric(payslipData.performanceIncentive)
  const specialIncentive = parseNumeric(payslipData.specialIncentive)

  // Calculate deductions
  const professionTax = parseNumeric(payslipData.professionTax)
  const pfAmount = parseNumeric(payslipData.pfAmount)
  const esic = parseNumeric(payslipData.esic)
  const arrearDeduction = parseNumeric(payslipData.arrearDeduction)
  const karmaLife = parseNumeric(payslipData.karmaLife)

  // Calculate totals
  const totalGrossA =
    basic +
    hra +
    specialAllowance +
    statutoryBonus +
    arrearsAmount +
    otAmount +
    extraHolidayPay +
    attendanceIncentive +
    performanceIncentive +
    specialIncentive

  const grossDeductionB = professionTax + pfAmount + esic + arrearDeduction + karmaLife

  const netTakeHome = totalGrossA - grossDeductionB

  return {
    totalGrossA,
    grossDeductionB,
    netTakeHome,
  }
}

// Function to convert number to words
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

  // Handle lakhs (100,000s)
  chunk = Math.floor(num / 100000)
  if (chunk > 0) {
    words += convertLessThanOneThousand(chunk) + " lakh"
    if (chunk > 1) words += "s"
    num %= 100000
    if (num > 0) words += " "
  }

  // Handle thousands
  chunk = Math.floor(num / 1000)
  if (chunk > 0) {
    words += convertLessThanOneThousand(chunk) + " thousand"
    num %= 1000
    if (num > 0) words += " "
  }

  // Handle hundreds and remaining
  if (num > 0) {
    words += convertLessThanOneThousand(num)
  }

  return words + " only"
}

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

      // Payslip details
      workingDays: payslip.workingDays || "",
      extraDays: payslip.extraDays || "",
      otHrs: payslip.otHrs || "",
      arrearsDays: payslip.arrearsDays || "",
      lop: payslip.lop || "",

      // Earnings
      basic: payslip.basic || "0",
      hra: payslip.hra || "0",
      specialAllowance: payslip.specialAllowance || "0",
      statutoryBonus: payslip.statutoryBonus || "0",
      arrearsAmount: payslip.arrearsAmount || "0",
      grossEarningsTotal: payslip.grossEarningsTotal || "0",
      otAmount: payslip.otAmount || "0",
      extraHolidayPay: payslip.extraHolidayPay || "0",
      attendanceIncentive: payslip.attendanceIncentive || "0",
      performanceIncentive: payslip.performanceIncentive || "0",
      specialIncentive: payslip.specialIncentive || "0",

      // Deductions
      professionTax: payslip.professionTax || "0",
      pfAmount: payslip.pfAmount || "0",
      esic: payslip.esic || "0",
      arrearDeduction: payslip.arrearDeduction || "0",
      karmaLife: payslip.karmaLife || "0",

      // Totals
      totalGrossA: payslip.totalGrossA || "0",
      grossDeductionB: payslip.grossDeductionB || "0",
      netTakeHome: payslip.netTakeHome || "0",
      netPayWords: payslip.netPayWords || "",

      // Month and year
      month: payslip.month || monthNum,
      year: payslip.year || year,

      // Client details
      clientName: client ? client.name : "Newchecks Solutions Pvt. Ltd",
      clientAddress: client ? client.address : "#428, 2nd floor 8th block Koramangala, Bangalore, Karnataka- 560095",
    }

    // Calculate totals
    const calculatedTotals = calculateTotals(payslipData)

    // Update the payslip data with calculated values
    payslipData.totalGrossA = calculatedTotals.totalGrossA.toString()
    payslipData.grossDeductionB = calculatedTotals.grossDeductionB.toString()
    payslipData.netTakeHome = calculatedTotals.netTakeHome.toString()

    // Generate net pay in words if not already present
    if (!payslipData.netPayWords || payslipData.netPayWords === "") {
      payslipData.netPayWords = numberToWords(calculatedTotals.netTakeHome)
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

