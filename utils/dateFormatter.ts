// Helper function (not exported)
const formatToIndianDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}` // Changed to dd-mm-yyyy format
}

// Function to format date to DD-MM-YYYY format
export const formatDateToDDMMYYYY = (input: string | number | Date): string => {
  if (!input) return "--"

  // Handle Date objects
  if (input instanceof Date) {
    return !isNaN(input.getTime()) ? formatToIndianDate(input) : "--"
  }

  // Handle string dates
  if (typeof input === "string") {
    // Try ISO format (2015-06-01T00:00:00.000Z)
    if (/^\d{4}-\d{2}-\d{2}T/.test(input)) {
      const date = new Date(input)
      if (!isNaN(date.getTime())) return formatToIndianDate(date)
    }

    // Try parsing with Date object (fallback)
    const parsedDate = new Date(input)
    if (!isNaN(parsedDate.getTime())) {
      return formatToIndianDate(parsedDate)
    }
  }

  // Handle numeric timestamps
  if (typeof input === "number") {
    const date = new Date(input)
    if (!isNaN(date.getTime())) {
      return formatToIndianDate(date)
    }
  }

  return "--"
}

export const formatExcelDate = (input: string | number | Date): string => {
  if (!input) return "--"

  // Handle Date objects
  if (input instanceof Date) {
    return !isNaN(input.getTime()) ? formatToIndianDate(input) : "--"
  }

  // Handle Excel serial numbers (as number or string)
  if (typeof input === "number" || (typeof input === "string" && /^\d+$/.test(input))) {
    const serialNumber = typeof input === "string" ? Number.parseInt(input) : input

    // Excel incorrectly treats 1900 as a leap year
    const adjustedSerial = serialNumber > 59 ? serialNumber - 1 : serialNumber
    const baseDate = new Date(1900, 0, adjustedSerial)

    return !isNaN(baseDate.getTime()) ? formatToIndianDate(baseDate) : "--"
  }

  // Handle string dates
  if (typeof input === "string") {
    // Try ISO format (2015-06-01T00:00:00.000Z)
    if (/^\d{4}-\d{2}-\d{2}T/.test(input)) {
      const date = new Date(input)
      if (!isNaN(date.getTime())) return formatToIndianDate(date)
    }

    // Try Excel format (13-Nov-24)
    const excelFormat = input.match(/^(\d{1,2})-([a-zA-Z]{3})-(\d{2})$/)
    if (excelFormat) {
      const [, day, month, year] = excelFormat
      const monthIndex = new Date(`${month} 1, 2000`).getMonth()
      const date = new Date(2000 + Number.parseInt(year), monthIndex, Number.parseInt(day))
      return !isNaN(date.getTime()) ? formatToIndianDate(date) : "--"
    }

    // Try parsing with Date object (fallback)
    const parsedDate = new Date(input)
    if (!isNaN(parsedDate.getTime())) {
      return formatToIndianDate(parsedDate)
    }
  }

  return "--"
}

// Simplified main export
export const formatDate = (input: string | number | Date): string => {
  return formatExcelDate(input)
}

