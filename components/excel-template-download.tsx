"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import * as XLSX from "xlsx"
import { columnNotes, excelColumnHeaders, sampleExcelRow } from "@/utils/excel-template"

export default function ExcelTemplateDownload() {
  const downloadTemplate = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new()

    // Data sheet: header row only, so the sample employee is never uploaded by mistake.
    // The upload reads the first sheet, so this must stay first.
    const ws = XLSX.utils.aoa_to_sheet([excelColumnHeaders])
    ws["!cols"] = excelColumnHeaders.map((h) => ({ wch: Math.max(h.length + 2, 12) }))
    XLSX.utils.book_append_sheet(wb, ws, "Payslips")

    // Instructions sheet: one line per column with notes and a worked example
    const instructions = [
      ["Column", "Example", "Notes"],
      ...excelColumnHeaders.map((h) => [h, sampleExcelRow[h as keyof typeof sampleExcelRow] ?? "", columnNotes[h] ?? ""]),
      [],
      [
        "How to upload",
        "",
        "Fill one row per employee on the Payslips sheet without changing the header row. In Admin > Upload Data choose the client and month, then upload the file.",
      ],
    ]
    const infoWs = XLSX.utils.aoa_to_sheet(instructions)
    infoWs["!cols"] = [{ wch: 24 }, { wch: 26 }, { wch: 100 }]
    XLSX.utils.book_append_sheet(wb, infoWs, "Instructions")

    // Generate the Excel file and trigger download
    XLSX.writeFile(wb, "payslip_template.xlsx")
  }

  return (
    <Button onClick={downloadTemplate} size="sm" variant="outline">
      <Download className="mr-2 h-4 w-4" /> Download Excel Template
    </Button>
  )
}
