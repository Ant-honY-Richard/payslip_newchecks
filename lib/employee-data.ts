// This file simulates data that would normally be fetched from an Excel file or database

export const employeeData = [
  {
    employeeId: "NCS7582",
    employeeName: "Ashin Kuruvilla",
    mobileNumber: "9876543210", // Added mobile number for validation
    dob: "31/01/2000",
    doj: "29-12-2024",
    designation: "PICKER - PACKER",
    department: "UE Store-OPS",
    bankName: "HDFC BANK",
    bankAccountNo: "50100684934908",
    ifscCode: "HDFC0005021",
    panNo: "0",
    pfNumber: "101838775314",
    workingDays: "31",
    uanNo: "101838775314",
    esicNo: "5404019959",
    extraDays: "1",
    otHrs: "60",
    arrearsDays: "0",
    lop: "0",

    // Earnings
    basic: "13456",
    hra: "471",
    specialAllowance: "0",
    statutoryBonus: "1121",
    arrearsAmount: "0",
    grossEarningsTotal: "15048",
    otAmount: "9208",
    extraHolidayPay: "515",
    attendanceIncentive: "0",
    performanceIncentive: "0",
    specialIncentive: "0",

    // Deductions
    professionTax: "320",
    pfAmount: "1250",
    esic: "91",
    arrearDeduction: "112",
    karmaLife: "0",

    // Totals
    totalGrossA: "23623",
    grossDeductionB: "1661",
    netTakeHome: "21962",
    netPayWords: "twenty-one thousand nine hundred sixty-two",

    // Month data is available for
    availableMonths: [
      "2023-01",
      "2023-02",
      "2023-03",
      "2023-04",
      "2023-05",
      "2023-06",
      "2023-07",
      "2023-08",
      "2023-09",
      "2023-10",
      "2023-11",
      "2023-12",
    ],
  },
  // Adding more sample employees
  {
    employeeId: "NCS7583",
    employeeName: "John Doe",
    mobileNumber: "9876543211",
    dob: "15/05/1995",
    doj: "10-01-2023",
    designation: "SOFTWARE ENGINEER",
    department: "IT",
    bankName: "ICICI BANK",
    bankAccountNo: "50100684934909",
    ifscCode: "ICIC0001234",
    panNo: "ABCDE1234F",
    pfNumber: "101838775315",
    workingDays: "30",
    uanNo: "101838775315",
    esicNo: "5404019960",
    extraDays: "0",
    otHrs: "0",
    arrearsDays: "0",
    lop: "1",

    basic: "45000",
    hra: "22500",
    specialAllowance: "15000",
    statutoryBonus: "0",
    arrearsAmount: "0",
    grossEarningsTotal: "82500",
    otAmount: "0",
    extraHolidayPay: "0",
    attendanceIncentive: "0",
    performanceIncentive: "5000",
    specialIncentive: "0",

    professionTax: "200",
    pfAmount: "1800",
    esic: "0",
    arrearDeduction: "0",
    karmaLife: "500",

    totalGrossA: "87500",
    grossDeductionB: "2500",
    netTakeHome: "85000",
    netPayWords: "eighty-five thousand only",

    availableMonths: ["2023-01", "2023-02", "2023-03", "2023-04", "2023-05"],
  },
  {
    employeeId: "NCS7584",
    employeeName: "Jane Smith",
    mobileNumber: "9876543212",
    dob: "22/11/1992",
    doj: "05-03-2022",
    designation: "HR MANAGER",
    department: "HUMAN RESOURCES",
    bankName: "SBI BANK",
    bankAccountNo: "50100684934910",
    ifscCode: "SBIN0001234",
    panNo: "FGHIJ5678K",
    pfNumber: "101838775316",
    workingDays: "31",
    uanNo: "101838775316",
    esicNo: "5404019961",
    extraDays: "0",
    otHrs: "0",
    arrearsDays: "0",
    lop: "0",

    basic: "55000",
    hra: "27500",
    specialAllowance: "18000",
    statutoryBonus: "0",
    arrearsAmount: "0",
    grossEarningsTotal: "100500",
    otAmount: "0",
    extraHolidayPay: "0",
    attendanceIncentive: "0",
    performanceIncentive: "8000",
    specialIncentive: "2000",

    professionTax: "200",
    pfAmount: "1800",
    esic: "0",
    arrearDeduction: "0",
    karmaLife: "500",

    totalGrossA: "110500",
    grossDeductionB: "2500",
    netTakeHome: "108000",
    netPayWords: "one hundred eight thousand only",

    availableMonths: ["2023-01", "2023-02", "2023-03", "2023-04", "2023-05", "2023-06"],
  },
]

// Function to get employee data by month
export function getEmployeeDataByMonth(month: string) {
  return employeeData.filter((emp) => emp.availableMonths.includes(month))
}

// Function to validate employee credentials and month availability
export function validateEmployee(employeeId: string, mobileNumber: string, month: string) {
  const employee = employeeData.find((emp) => emp.employeeId === employeeId)

  if (!employee) {
    return { valid: false, message: "Employee ID not found" }
  }

  if (employee.mobileNumber !== mobileNumber) {
    return { valid: false, message: "Mobile number does not match our records" }
  }

  if (!employee.availableMonths.includes(month)) {
    return { valid: false, message: "No payslip available for the selected month" }
  }

  return { valid: true, employee }
}

