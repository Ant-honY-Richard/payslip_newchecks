"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import * as XLSX from "xlsx"
import { excelColumnHeaders, sampleExcelRow } from "@/utils/excel-template"

export default function ExcelTemplateDownload() {
  const downloadTemplate = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new()

    // Create a worksheet with headers and one sample row
    const ws = XLSX.utils.json_to_sheet([sampleExcelRow], {
      header: excelColumnHeaders,
    })

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Payslip Template")

    // Generate the Excel file and trigger download
    XLSX.writeFile(wb, "payslip_template.xlsx")
  }

  return (
    <Button onClick={downloadTemplate} size="sm" variant="outline">
      <Download className="mr-2 h-4 w-4" /> Download Excel Template
    </Button>
  )
}

