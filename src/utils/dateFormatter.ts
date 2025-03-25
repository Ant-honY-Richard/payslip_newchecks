// src/utils/dateFormatter.ts

export const formatExcelDate = (input: string | number | Date): string => {
    if (!input) return '--';

    // Handle Date objects
    if (input instanceof Date) {
      return formatToIndianDate(input);
    }

    // Handle Excel serial numbers (as number or string)
    if (typeof input === 'number' || (typeof input === 'string' && /^\d+$/.test(input))) {
      const serialNumber = typeof input === 'string' ? parseInt(input) : input;
      return convertExcelSerialToDate(serialNumber);
    }

    // Handle string dates
    if (typeof input === 'string') {
      // Try Excel format (13-Nov-24)
      const excelFormat = tryParseExcelFormat(input);
      if (excelFormat) return excelFormat;

      // Try DD/MM/YYYY or similar formats
      const parsedDate = tryParseDateString(input);
      if (parsedDate) return parsedDate;
    }

    return '--';
  };

export const formatDate = (input: string | number | Date): string => {
  if (!input) return '--';

  // Handle Date objects
  if (input instanceof Date) {
    return formatToIndianDate(input);
  }

  // Handle string dates
  if (typeof input === 'string') {
    // Try parsing with Date object
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) return formatToIndianDate(parsed);
  }

  // If all else fails, try the Excel date formatter
  return formatExcelDate(input);
};

// Helper functions
const convertExcelSerialToDate = (serial: number): string => {
  // Excel incorrectly treats 1900 as a leap year
  const adjustedSerial = serial > 59 ? serial - 1 : serial;
  const baseDate = new Date(1900, 0, adjustedSerial);
  return formatToIndianDate(baseDate);
};

const tryParseExcelFormat = (input: string): string | null => {
  const match = input.match(/^(\d{1,2})-([a-zA-Z]{3})-(\d{2})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const monthIndex = new Date(`${month} 1, 2000`).getMonth();
  const fullYear = 2000 + parseInt(year);
  const date = new Date(fullYear, monthIndex, parseInt(day));

  return isNaN(date.getTime()) ? null : formatToIndianDate(date);
};

const tryParseDateString = (input: string): string | null => {
  // Try parsing with Date object
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) return formatToIndianDate(parsed);

  // Try DD/MM/YYYY format
  const parts = input.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);

    // Check if the year might be an Excel serial number
    if (year > 3000) {
      return convertExcelSerialToDate(year);
    }

    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return formatToIndianDate(date);
  }

  return null;
};

const formatToIndianDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};