import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, Employee, Payslip } from "@/lib/mongodb";

export const maxDuration = 9;

const parseNumeric = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const calculateTotals = (payslipData: any) => {
  const basic = parseNumeric(payslipData.basic) || 0;
  const hra = parseNumeric(payslipData.hra) || 0;
  const specialAllowance = parseNumeric(payslipData.specialAllowance) || 0;
  const statutoryBonus = parseNumeric(payslipData.statutoryBonus) || 0;
  const arrearsAmount = parseNumeric(payslipData.arrearsAmount) || 0;
  const otAmount = parseNumeric(payslipData.otAmount) || 0;
  const extraHolidayPay = parseNumeric(payslipData.extraHolidayPay) || 0;
  const attendanceIncentive = parseNumeric(payslipData.attendanceIncentive) || 0;
  const performanceIncentive = parseNumeric(payslipData.performanceIncentive) || 0;
  const specialIncentive = parseNumeric(payslipData.specialIncentive) || 0;

  const professionTax = parseNumeric(payslipData.professionTax) || 0;
  const pfAmount = parseNumeric(payslipData.pfAmount) || 0;
  const esic = parseNumeric(payslipData.esic) || 0;
  const arrearDeduction = parseNumeric(payslipData.arrearDeduction) || 0;
  const karmaLife = parseNumeric(payslipData.karmaLife) || 0;

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
    specialIncentive;

  const grossDeductionB = professionTax + pfAmount + esic + arrearDeduction + karmaLife;
  const netTakeHome = totalGrossA - grossDeductionB;

  console.log(`Calculated totals for ${payslipData.employeeId}:`, {
    basic,
    hra,
    totalGrossA,
    grossDeductionB,
    netTakeHome,
  });

  return { totalGrossA, grossDeductionB, netTakeHome };
};

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
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  if (num === 0) return "zero";

  const convertLessThanOneThousand = (n: number): string => {
    if (n < 20) return units[n];
    const digit = n % 10;
    if (n < 100) return tens[Math.floor(n / 10)] + (digit ? "-" + units[digit] : "");
    return (
      units[Math.floor(n / 100)] +
      " hundred" +
      (n % 100 ? " and " + convertLessThanOneThousand(n % 100) : "")
    );
  };

  let words = "";
  let chunk = 0;

  chunk = Math.floor(num / 100000);
  if (chunk > 0) {
    words += convertLessThanOneThousand(chunk) + " lakh";
    if (chunk > 1) words += "s";
    num %= 100000;
    if (num > 0) words += " ";
  }

  chunk = Math.floor(num / 1000);
  if (chunk > 0) {
    words += convertLessThanOneThousand(chunk) + " thousand";
    num %= 1000;
    if (num > 0) words += " ";
  }

  if (num > 0) {
    words += convertLessThanOneThousand(num);
  }

  return words + " only";
};

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { payslips, month, year, clientId } = body;

    if (!payslips || !Array.isArray(payslips) || payslips.length === 0) {
      return NextResponse.json(
        { success: false, error: "No payslips provided or invalid format" },
        { status: 400 }
      );
    }
    if (!month || !year) {
      return NextResponse.json({ success: false, error: "Month and year are required" }, { status: 400 });
    }
    if (!clientId) {
      return NextResponse.json({ success: false, error: "Client ID is required" }, { status: 400 });
    }

    console.log("Received payslips:", payslips);

    const results = await Promise.all(
      payslips.map(async (payslipData: any) => {
        try {
          if (!payslipData.employeeId) {
            throw new Error("Employee ID is required");
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
            clientId: clientId || payslipData.clientId, // Added clientId to Employee
            updatedAt: new Date(),
          };

          const processedPayslip = {
            employeeId: payslipData.employeeId,
            month,
            year,
            workingDays: payslipData.workingDays || "",
            extraDays: parseNumeric(payslipData.extraDays) || 0,
            otHrs: parseNumeric(payslipData.otHrs) || 0,
            arrearsDays: payslipData.arrearsDays || "",
            lop: payslipData.lop || "",
            basic: parseNumeric(payslipData.basic) || 0,
            hra: parseNumeric(payslipData.hra) || 0,
            specialAllowance: parseNumeric(payslipData.specialAllowance) || 0,
            statutoryBonus: parseNumeric(payslipData.statutoryBonus) || 0,
            arrearsAmount: parseNumeric(payslipData.arrearsAmount) || 0,
            otAmount: parseNumeric(payslipData.otAmount) || 0,
            extraHolidayPay: parseNumeric(payslipData.extraHolidayPay) || 0,
            attendanceIncentive: parseNumeric(payslipData.attendanceIncentive) || 0,
            performanceIncentive: parseNumeric(payslipData.performanceIncentive) || 0,
            specialIncentive: parseNumeric(payslipData.specialIncentive) || 0,
            professionTax: parseNumeric(payslipData.professionTax) || 0, // Matches schema
            pfAmount: parseNumeric(payslipData.pfAmount) || 0,
            esic: parseNumeric(payslipData.esic) || 0,
            arrearDeduction: parseNumeric(payslipData.arrearDeduction) || 0,
            karmaLife: parseNumeric(payslipData.karmaLife) || 0,
            clientId: clientId || payslipData.clientId,
            updatedAt: new Date(),
          };

          const calculatedTotals = calculateTotals(processedPayslip);
          processedPayslip.totalGrossA = calculatedTotals.totalGrossA || 0;
          processedPayslip.grossDeductionB = calculatedTotals.grossDeductionB || 0;
          processedPayslip.netTakeHome = calculatedTotals.netTakeHome || 0;
          processedPayslip.netPayWords = numberToWords(calculatedTotals.netTakeHome || 0);

          console.log(`Processed employee data before save:`, employeeData);
          console.log(`Processed payslip data before save:`, processedPayslip);

          const employee = await Employee.findOneAndUpdate(
            { employeeId: payslipData.employeeId },
            { $set: employeeData },
            { upsert: true, new: true }
          ).lean().exec();

          const payslip = await Payslip.findOneAndUpdate(
            { employeeId: payslipData.employeeId, month, year },
            { $set: processedPayslip },
            { upsert: true, new: true }
          ).lean().exec();

          console.log(`Raw employee from MongoDB:`, employee);
          console.log(`Raw payslip from MongoDB:`, payslip);

          console.log(`Successfully saved employee:`, {
            employeeId: employee.employeeId,
            employeeName: employee.name, // Changed to 'name'
            mobileNumber: employee.mobileNumber,
            department: employee.department,
            designation: employee.designation,
          });
          console.log(`Successfully saved payslip:`, {
            employeeId: payslip.employeeId,
            month: payslip.month,
            year: payslip.year,
            netTakeHome: payslip.netTakeHome,
            totalGrossA: payslip.totalGrossA,
            grossDeductionB: payslip.grossDeductionB,
            clientId: payslip.clientId,
          });

          return {
            employeeId: payslipData.employeeId,
            success: true,
            message: "Processed successfully",
          };
        } catch (error) {
          console.error(`Error processing payslip for employee ${payslipData.employeeId}:`, error);
          return {
            employeeId: payslipData.employeeId,
            success: false,
            message: error instanceof Error ? error.message : "Failed to process",
          };
        }
      })
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${successful} payslips successfully. ${failed} failed.`,
      results,
      processedCount: payslips.length,
      totalCount: payslips.length,
    });
  } catch (error) {
    console.error("Error processing bulk payslips:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to process bulk payslips: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}