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
  "Karma Life",

  // Totals
  "Total Gross A",
  "Gross Deductions B",
  "Take Home",
  "Net Pay In Words",
]

// Sample row for reference
export const sampleExcelRow = {
  "Emp ID": "NCS7582",
  "Employee Name": "John Doe",
  "Mobile Number": "9876543210",
  DOB: "31/01/1990",
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
  "Arrears Days": "0",
  LOP: "0",
  BASIC: "45000",
  HRA: "22500",
  "Special Allowance": "15000",
  "Statutory Bonus": "0",
  "Arrears amount": "0",
  "Gross Earnings Total": "82500",
  "OT Amount": "2500",
  "Extra & Holiday pay": "1500",
  "Attendance Incentive": "1000",
  "Performance Incentive": "5000",
  "Special Incentive": "0",
  "Profession Tax": "200",
  "PF amount": "1800",
  ESIC: "0",
  "Arrear Deduction": "0",
  "Karma Life": "500",
  "Total Gross A": "92500",
  "Gross Deductions B": "2500",
  "Take Home": "90000",
  "Net Pay In Words": "Ninety thousand only",
}

// Function to generate an empty Excel template
export function generateExcelTemplate() {
  return {
    headers: excelColumnHeaders,
    data: [sampleExcelRow],
  }
}

