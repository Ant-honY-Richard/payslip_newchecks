"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface PDFGeneratorProps {
  elementId: string
  fileName: string
  buttonText?: string
}

export default function PDFGenerator({ elementId, fileName, buttonText = "Download PDF" }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error(`Element with ID "${elementId}" not found`)
      return
    }

    setIsGenerating(true)

    try {
      // Add a temporary class to improve PDF rendering
      element.classList.add("generating-pdf")

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        // Increase height to ensure all content is captured
        windowHeight: element.scrollHeight + 200,
      })

      // Remove the temporary class
      element.classList.remove("generating-pdf")

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`${fileName}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={generatePDF} disabled={isGenerating} size="sm">
      {isGenerating ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Generating...
        </span>
      ) : (
        <span className="flex items-center">
          <Download className="mr-2 h-4 w-4" /> {buttonText}
        </span>
      )}
    </Button>
  )
}

