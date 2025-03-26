"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Image from "next/image"
import { formatDate } from "@/utils/dateFormatter"

interface PayslipData {
  employeeId: string
  employeeName: string
  mobileNumber: string
  dob: string
  doj: string
  designation: string
  department: string
  bankName: string
  bankAccountNo: string
  ifscCode: string
  panNo: string
  pfNumber: string
  uanNo: string
  esicNo: string
  workingDays: string
  extraDays: string
  otHrs: string
  arrearsDays: string
  lop: string
  basic: string
  hra: string
  specialAllowance: string
  statutoryBonus: string
  arrearsAmount: string
  grossEarningsTotal: string
  otAmount: string
  extraHolidayPay: string
  attendanceIncentive: string
  performanceIncentive: string
  specialIncentive: string
  professionTax: string
  pfAmount: string
  esic: string
  arrearDeduction: string
  karmaLife: string
  totalGrossA: string
  grossDeductionB: string
  netTakeHome: string
  netPayWords: string
  month: string
  year: string
  clientName: string
  clientAddress: string
}

// Helper function to ensure values are displayed properly
const formatValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "--"
  if (typeof value === "number") return value.toString()
  return value
}

// Helper function to format currency values
const formatCurrency = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "₹0"
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  if (isNaN(numValue)) return "₹0"

  // Format with thousand separators for better readability
  return `₹${numValue.toLocaleString('en-IN')}`
}

export default function PayslipPage() {
  const searchParams = useSearchParams()
  const employeeId = searchParams.get("id")
  const month = searchParams.get("month")

  const [payslipData, setPayslipData] = useState<PayslipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!employeeId || !month) {
      setError("Missing required information. Please go back and try again.")
      setLoading(false)
      return
    }

    async function fetchPayslip() {
      try {
        setLoading(true)

        const response = await fetch(`/api/payslip/${employeeId}/${month}`)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API returned ${response.status}: ${errorText}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch payslip")
        }

        console.log("Payslip data:", result.data)
        setPayslipData(result.data)
      } catch (err) {
        console.error("Error fetching payslip:", err)
        setError(err instanceof Error ? err.message : "No payslip found for the selected criteria.")
      } finally {
        setLoading(false)
      }
    }

    fetchPayslip()
  }, [employeeId, month])

  const generatePDF = async () => {
    const payslipElement = document.getElementById("payslip")
    if (!payslipElement) return

    try {
      // Show loading indicator
      const loadingIndicator = document.createElement("div")
      loadingIndicator.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      loadingIndicator.innerHTML = `
        <div class="bg-white p-4 rounded-lg flex flex-col items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p class="mt-2 text-sm">Generating PDF...</p>
        </div>
      `
      document.body.appendChild(loadingIndicator)

      // Add a class to improve PDF rendering
      payslipElement.classList.add("generating-pdf")

      // For mobile optimization, we need to ensure proper scaling
      const isMobile = window.innerWidth < 768

      const canvas = await html2canvas(payslipElement, {
        scale: isMobile ? 3 : 2, // Higher scale for mobile for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        // A4 dimensions at 96 DPI
        width: 793, // 210mm at 96 DPI
        height: 1122, // 297mm at 96 DPI
      })

      // Remove the class after capturing
      payslipElement.classList.remove("generating-pdf")

      const imgData = canvas.toDataURL("image/png", 1.0)

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      // Add image to fit exactly on A4 page
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297) // A4 dimensions in mm

      // Remove loading indicator
      document.body.removeChild(loadingIndicator)

      pdf.save(`Payslip_${employeeId}_${month}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")

      // Remove loading indicator if it exists
      const loadingIndicator = document.querySelector(".fixed.inset-0.bg-black\\/50")
      if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payslip data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-destructive">
          <CardContent className="pt-6">
            <div className="text-xl text-destructive font-bold mb-2">Payslip Not Found</div>
            <p>{error}</p>
            <div className="mt-6">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payslipData) {
    return null
  }

  // Format month for display
  const monthName = new Date(Number.parseInt(payslipData.year), Number.parseInt(payslipData.month) - 1).toLocaleString(
    "default",
    {
      month: "long",
    },
  )
  const displayMonth = `${monthName}-${payslipData.year}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-1 sm:p-3 md:p-6 a4-container">
      <div className="max-w-[210mm] mx-auto">
        {/* Action buttons */}
        <div className="flex justify-between items-center mb-2 sm:mb-4 sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-1 rounded-md">
          <Link href="/">
            <Button variant="outline" size="sm" className="h-8">
              <ArrowLeft className="mr-1 h-3 w-3" /> Back
            </Button>
          </Link>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-8" onClick={() => window.print()}>
              <Printer className="mr-1 h-3 w-3" /> Print
            </Button>
            <Button size="sm" className="h-8" onClick={generatePDF}>
              <Download className="mr-1 h-3 w-3" /> Download
            </Button>
          </div>
        </div>

        {/* Payslip container */}
        <div
          id="payslip"
          className="bg-white rounded-lg shadow-lg border print:shadow-none print:border-0 relative w-full max-w-[210mm] mx-auto print:w-[210mm] print:h-[297mm]"
          style={{ minHeight: "calc(100vh - 60px)" }}
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="relative w-48 h-48 opacity-5">
              <Image src="/images/logo.png" alt="Watermark" fill style={{ objectFit: "contain" }} />
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-3 sm:p-5 flex flex-col h-full">
            {/* Header with Logo - Horizontal Layout */}
            <div className="flex flex-row items-center mb-4 border-b border-gray-200 pb-3">
              <div className="mr-3">
                <Image
                  src="/images/logo.png"
                  alt="Newchecks Solutions"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-primary">Newchecks Solutions Pvt. Ltd</h1>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">
                  {payslipData.clientAddress || "#428, 2nd floor 8th block Koramangala, Bangalore, Karnataka- 560095."}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
              <div className="bg-primary/10 py-2 px-3 flex flex-col sm:flex-row justify-between items-center">
                <h2 className="text-sm sm:text-base font-bold text-primary">Salary Slip: {displayMonth}</h2>
                <p className="text-[11px] sm:text-sm font-medium">Client: {formatValue(payslipData.clientName)}</p>
              </div>
            </div>

            {/* Employee & Bank Details - Combined for mobile */}
            <div className="mb-2 sm:mb-3 border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 py-1 px-2 border-b border-gray-200">
                <h3 className="text-[11px] sm:text-sm font-bold text-gray-700">Employee Information</h3>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="space-y-2">
                    <div className="flex flex-row justify-between border-b pb-2 border-gray-100">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Employee ID:</span>
                      <span className="font-medium text-right">{formatValue(payslipData.employeeId)}</span>
                    </div>

                    <div className="flex flex-row justify-between border-b pb-2 border-gray-100">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Employee Name:</span>
                      <span className="font-medium text-right">{formatValue(payslipData.employeeName)}</span>
                    </div>

                    <div className="flex flex-row justify-between border-b pb-2 border-gray-100">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Designation:</span>
                      <span className="font-medium text-right">{formatValue(payslipData.designation)}</span>
                    </div>

                    <div className="flex flex-row justify-between border-b pb-2 border-gray-100">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Joining Date:</span>
                      <span className="font-medium text-right">{formatDate(payslipData.doj)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-200 sm:pl-6">
                    <div className="flex flex-row justify-between border-b pb-2 border-gray-100">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Bank Name:</span>
                      <span className="font-medium text-right">{formatValue(payslipData.bankName)}</span>
                    </div>

                    <div className="flex flex-row justify-between border-b pb-2 border-gray-100">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Account No:</span>
                      <span className="font-medium text-right">{formatValue(payslipData.bankAccountNo)}</span>
                    </div>

                    <div className="flex flex-row justify-between border-b pb-2 border-gray-100">
                      <span className="font-semibold text-gray-700 min-w-[120px]">IFSC Code:</span>
                      <span className="font-medium text-right">{formatValue(payslipData.ifscCode)}</span>
                    </div>

                    <div className="flex flex-row justify-between border-b pb-2 border-gray-100">
                      <span className="font-semibold text-gray-700 min-w-[120px]">UAN/PF No:</span>
                      <span className="font-medium text-right">{formatValue(payslipData.uanNo)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Days and Day Paid */}
            <div className="mb-2 sm:mb-3 border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 py-1 px-2 border-b border-gray-200">
                <h3 className="text-[11px] sm:text-sm font-bold text-gray-700">Attendance Summary</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3 text-[11px] sm:text-sm">
                <div className="flex flex-col items-center justify-center border-r border-gray-200">
                  <span className="font-semibold text-gray-700">Total Days</span>
                  <span className="font-bold text-lg sm:text-xl mt-1">{formatValue(payslipData.workingDays)}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-r border-gray-200">
                  <span className="font-semibold text-gray-700">Days Paid</span>
                  <span className="font-bold text-lg sm:text-xl mt-1">{formatValue(payslipData.workingDays)}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="font-semibold text-gray-700">LOP Days</span>
                  <span className="font-bold text-lg sm:text-xl mt-1">{payslipData.lop && payslipData.lop !== "0" ? formatValue(payslipData.lop) : "0"}</span>
                </div>
              </div>
            </div>

            {/* Earnings and Deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* Earnings */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-blue-50 py-1.5 px-3 font-bold text-center text-[11px] sm:text-sm text-blue-700 border-b border-gray-200">
                  Earnings
                </div>
                <div className="p-3">
                  <table className="w-full text-[11px] sm:text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-1.5 font-semibold text-gray-700 w-3/5">Component</th>
                        <th className="text-right py-1.5 font-semibold text-gray-700 w-2/5">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-medium">Basic</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.basic)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-medium">HRA</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.hra)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-medium">Bonus Gross</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.statutoryBonus)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-medium">Lunch/Food Allowance</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.specialAllowance)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-medium">OT ({formatValue(payslipData.otHrs)} hrs)</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.otAmount)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-medium">Extra Pay ({formatValue(payslipData.extraDays)} days)</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.extraHolidayPay)}</td>
                      </tr>

                      {/* Incentives Subsection */}
                      <tr className="bg-blue-50">
                        <td colSpan={2} className="py-1.5 font-semibold text-center text-[11px] sm:text-sm text-blue-700">
                          Incentives
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pl-2 font-medium">Attendance</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.attendanceIncentive)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pl-2 font-medium">Performance</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.performanceIncentive)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pl-2 font-medium">Special</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.specialIncentive)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 py-1.5 px-3 font-bold text-center text-[11px] sm:text-sm text-red-700 border-b border-gray-200">
                  Deductions
                </div>
                <div className="p-3">
                  <table className="w-full text-[11px] sm:text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-1.5 font-semibold text-gray-700 w-3/5">Component</th>
                        <th className="text-right py-1.5 font-semibold text-gray-700 w-2/5">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-medium">PF Employee</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.pfAmount)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-medium">Professional Tax</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.professionTax)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-medium">Karma Life</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(payslipData.karmaLife)}</td>
                      </tr>
                      {payslipData.esic && payslipData.esic !== "0" && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 font-medium">ESIC</td>
                          <td className="text-right py-2 font-medium">{formatCurrency(payslipData.esic)}</td>
                        </tr>
                      )}
                      {/* Add empty row to match height with earnings table if needed */}
                      <tr className="border-b border-gray-100 h-10">
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Total Earning, Deduction, and Net Pay */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
              <div className="bg-gray-50 py-1 px-2 border-b border-gray-200">
                <h3 className="text-[11px] sm:text-sm font-bold text-gray-700">Payment Summary</h3>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                    <span className="font-semibold text-[11px] sm:text-sm text-gray-700">Total Earnings:</span>
                    <span className="font-bold text-[13px] sm:text-base text-blue-700">{formatCurrency(payslipData.totalGrossA)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded-md">
                    <span className="font-semibold text-[11px] sm:text-sm text-gray-700">Total Deductions:</span>
                    <span className="font-bold text-[13px] sm:text-base text-red-700">{formatCurrency(payslipData.grossDeductionB)}</span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-green-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[13px] sm:text-base text-gray-700">Net Pay:</span>
                    <span className="font-bold text-[16px] sm:text-lg text-green-700">{formatCurrency(payslipData.netTakeHome)}</span>
                  </div>
                  <div className="mt-1 text-center text-[11px] sm:text-xs font-medium text-gray-600">
                    {payslipData.netPayWords}
                  </div>
                </div>
              </div>
            </div>

            {/* UTR Number */}
            <div className="border border-gray-200 rounded-lg p-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[11px] sm:text-sm text-gray-700">UTR Number:</span>
                <span className="font-medium text-[11px] sm:text-sm">N181243120625518</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-3 text-center text-[10px] sm:text-xs text-gray-500 border-t border-gray-200 pt-2">
              <p className="italic font-medium">*This is a computer generated statement and does not require signature.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

