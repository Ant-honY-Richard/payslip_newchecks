// This file provides a template for the Excel file structure required for payslip data

export const excelColumnHeaders = [
  // Employee Details
  "Emp ID",
  "Employee Name",
  "Mobile Number",
  "DOB",
  "DOJ",
  "Designation",
  "Department",
  "Bank Name",
  "Bank Account No",
  "IFSC code",
  "PAN NO",
  "PF Number",
  "UAN No",
  "ESI No",

  // Payslip Details
  "Number of days working",
  "Extra Days",
  "OT hrs",
  "Arrears Days",
  "LOP",

  // Earnings
  "BASIC",
  "HRA",
  "Special Allowance",
  "Statutory Bonus",
  "Arrears amount",
  "Gross Earnings Total",
  "OT Amount",
  "Extra & Holiday pay",
  "Attendance Incentive",
  "Performance Incentive",
  "Special Incentive",

  // Deductions
  "Profession Tax",
  "PF amount",
  "ESIC",
  "Arrear Deduction",
  "Other Deductions",

  // Totals
  "Total Gross A",
  "Gross Deductions B",
  "Take Home",
  "Net Pay In Words",
]

// Sample row for reference (totals add up: Total Gross A - Gross Deductions B = Take Home)
export const sampleExcelRow = {
  "Emp ID": "NCS7582",
  "Employee Name": "John Doe",
  "Mobile Number": "9876543210",
  DOB: "31-01-1990",
  DOJ: "01-01-2023",
  Designation: "Software Engineer",
  Department: "IT",
  "Bank Name": "HDFC BANK",
  "Bank Account No": "50100684934908",
  "IFSC code": "HDFC0005021",
  "PAN NO": "ABCDE1234F",
  "PF Number": "101838775314",
  "UAN No": "101838775314",
  "ESI No": "5404019959",
  "Number of days working": "31",
  "Extra Days": "1",
  "OT hrs": "10",
  "Arrears Days": "2",
  LOP: "0",
  BASIC: "45000",
  HRA: "22500",
  "Special Allowance": "15000",
  "Statutory Bonus": "0",
  "Arrears amount": "5000",
  "Gross Earnings Total": "87500",
  "OT Amount": "2500",
  "Extra & Holiday pay": "1500",
  "Attendance Incentive": "1000",
  "Performance Incentive": "5000",
  "Special Incentive": "0",
  "Profession Tax": "200",
  "PF amount": "1800",
  ESIC: "0",
  "Arrear Deduction": "0",
  "Other Deductions": "500",
  "Total Gross A": "97500",
  "Gross Deductions B": "2500",
  "Take Home": "95000",
  "Net Pay In Words": "Ninety five thousand only",
}

// What goes in each column, shown on the template's Instructions sheet
export const columnNotes: Record<string, string> = {
  "Emp ID": "Required. Unique employee code, used to log in",
  "Mobile Number": "Required. 10 digits, used to log in",
  DOB: "Date as DD-MM-YYYY",
  DOJ: "Date as DD-MM-YYYY",
  "Number of days working": "Paid days in the month",
  "Arrears Days": "Days the arrears amount is paid for",
  "Arrears amount": "Arrear pay added to earnings",
  "Gross Earnings Total": "BASIC + HRA + Special Allowance + Statutory Bonus + Arrears amount",
  "Arrear Deduction": "Arrears recovered from the employee",
  "Other Deductions": "Any other deduction (replaces the old Karma Life column)",
  "Total Gross A":
    "Gross Earnings Total + OT Amount + Extra & Holiday pay + incentives. Leave blank to calculate automatically",
  "Gross Deductions B":
    "Profession Tax + PF amount + ESIC + Arrear Deduction + Other Deductions. Leave blank to calculate automatically",
  "Take Home": "Total Gross A - Gross Deductions B. Leave blank to calculate automatically",
  "Net Pay In Words": "Optional. Generated from Take Home when blank",
}

// Function to generate an empty Excel template
export function generateExcelTemplate() {
  return {
    headers: excelColumnHeaders,
    data: [sampleExcelRow],
  }
}

