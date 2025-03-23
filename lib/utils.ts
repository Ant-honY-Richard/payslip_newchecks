import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to organize employee data by month
export function organizeDataByMonth(data: any[]) {
  const organizedData: Record<string, any[]> = {}

  data.forEach((employee) => {
    // In a real application, you would extract the month from the data
    // For this example, we'll use a placeholder
    const month = "2023-02" // February 2023

    if (!organizedData[month]) {
      organizedData[month] = []
    }

    organizedData[month].push(employee)
  })

  return organizedData
}

// Function to convert Excel date to JS date
export function excelDateToJSDate(excelDate: number) {
  // Excel dates are number of days since Dec 30, 1899
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const jsDate = new Date(Math.round((excelDate - 25569) * millisecondsPerDay))
  return jsDate
}

// Format currency
export function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num)
}

