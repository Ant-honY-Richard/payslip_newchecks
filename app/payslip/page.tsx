"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react"
import Link from "next/link"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

// PayslipData Interface
interface PayslipData {
  employeeId: string
  employeeName: string
  mobileNumber: string
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
  UTRNo?: string
}

// Utility Functions
const formatValue = (value: string | number | null | undefined, fallback = "--"): string => {
  if (value === null || value === undefined || value === "") return fallback
  return typeof value === "number" ? value.toLocaleString() : value
}

const formatCurrency = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "₹0"
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  return isNaN(numValue)
    ? "₹0"
    : `₹${numValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (dateString: string | number): string => {
  if (!dateString) return "--";

  // Handle Excel serial numbers
  const numericValue = Number(dateString);
  if (!isNaN(numericValue) && numericValue > 10000) { // Likely a serial number
    const excelEpoch = new Date(1899, 11, 30); // Excel base date
    const date = new Date(excelEpoch.getTime() + numericValue * 86400000);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const year = date.getFullYear();
      return `${day}-${month}-${year}`; // e.g., "17-06-2024"
    }
    return "--";
  }

  // Handle string dates (YYYY-MM-DD or DD-MM-YYYY)
  const parts = String(dateString).split(/[-/]/); // Split by hyphen or slash
  if (parts.length === 3) {
    let day, month, year;
    if (parts[0].length === 4) { // YYYY-MM-DD
      [year, month, day] = parts;
    } else { // DD-MM-YYYY
      [day, month, year] = parts;
    }
    // Validate and pad
    day = String(day).padStart(2, "0");
    month = String(month).padStart(2, "0");
    if (!isNaN(Date.parse(`${year}-${month}-${day}`))) {
      return `${day}-${month}-${year}`; // e.g., "17-06-2024" or "01-01-2023"
    }
  }

  return "--"; // Fallback for invalid formats
};

export default function PayslipPage() {
  const searchParams = useSearchParams()
  const employeeId = searchParams.get("id")
  const month = searchParams.get("month")

  const [payslipData, setPayslipData] = useState<PayslipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const payslipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!employeeId || !month) {
      setError("Missing required payslip information.")
      setLoading(false)
      return
    }

    async function fetchPayslip() {
      try {
        setLoading(true)
        const response = await fetch(`/api/payslip/${employeeId}/${month}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Payslip not found for the given employee and month.")
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        if (!result.success) throw new Error(result.error || "Failed to retrieve payslip")
        setPayslipData(result.data)
      } catch (err) {
        console.error("Payslip Fetch Error:", err)
        setError(err instanceof Error ? err.message : "Unexpected error occurred")
        toast({
          variant: "destructive",
          title: "Error loading payslip",
          description: err instanceof Error ? err.message : "Unexpected error occurred",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPayslip()
  }, [employeeId, month])

  const generatePDF = async () => {
    const payslipElement = payslipRef.current
    if (!payslipElement) return

    try {
      setIsPdfGenerating(true)
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your document...",
      })

      payslipElement.classList.add("generating-pdf")
      await new Promise((resolve) => setTimeout(resolve, 100))

      const canvas = await html2canvas(payslipElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: payslipElement.scrollWidth,
        windowHeight: payslipElement.scrollHeight,
      })

      payslipElement.classList.remove("generating-pdf")

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      const monthName = new Date(
        Number.parseInt(payslipData?.year || "0"),
        Number.parseInt(payslipData?.month || "1") - 1,
      ).toLocaleString("default", { month: "long" })
      const displayMonth = `${monthName}-${payslipData?.year}`

      pdf.save(`Payslip_${payslipData?.employeeName}_${displayMonth}.pdf`)

      toast({
        title: "PDF Generated Successfully",
        description: "Your payslip has been downloaded.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "There was an error creating your PDF. Please try again.",
      })
    } finally {
      setIsPdfGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-12 w-12 text-amber-500 animate-spin" />
          <p className="text-amber-700 font-semibold">Loading Payslip...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
        <Card className="w-full max-w-md p-6 border-red-300 shadow-lg">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (!payslipData) return null

  const monthName = new Date(Number.parseInt(payslipData.year), Number.parseInt(payslipData.month) - 1).toLocaleString(
    "default",
    { month: "long" },
  )
  const displayMonth = `${monthName}-${payslipData.year}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-2 sm:p-4 md:p-8 payslip-container">
      <div className="max-w-[210mm] mx-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6 print-hidden">
          <Link href="/">
            <Button variant="outline" size="sm" className="hover:bg-amber-50 transition-colors border-amber-300">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="hover:bg-amber-50 transition-colors border-amber-300"
            >
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button
              size="sm"
              onClick={generatePDF}
              disabled={isPdfGenerating}
              className="bg-amber-500 hover:bg-amber-600 transition-colors"
            >
              {isPdfGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
          </div>
        </div>

        <Card
          id="payslip"
          ref={payslipRef}
          className="w-full shadow-lg rounded-lg overflow-hidden border border-gray-200"
        >
          <div className="relative z-10 p-2 sm:p-4 flex flex-col">
            {/* New Header Layout with Logo on left, Company details on right */}
            <div className="bg-black text-white p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <div className="flex-shrink-0 mr-4 mb-2 sm:mb-0">
                  <Image
                    src="/images/header_logo.png"
                    alt="Newchecks Solutions"
                    width={60}
                    height={60}
                    className="object-contain"
                  />
                </div>
                <div className="text-left">
                  <h1 className="text-xl sm:text-2xl font-bold">Newchecks Solutions Pvt. Ltd</h1>
                  <p className="text-xs sm:text-sm text-gray-300">
                    {payslipData.clientAddress ||
                      "#428, 2nd floor 8th block Koramangala, Bangalore, Karnataka- 560095."}
                  </p>
                </div>
              </div>
            </div>

            {/* Separator and Month/Year Badge */}
            <div className="w-full h-1 bg-amber-500"></div>
            <div className="text-center py-2 bg-gray-100">
              <Badge variant="outline" className="bg-amber-50 text-black border-amber-300 text-sm px-4 py-1">
                Payslip for {displayMonth}
              </Badge>
            </div>
            <div className="w-full h-1 bg-amber-500 mb-4"></div>

            {/* Employee and Bank Details - Mobile Responsive Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm border border-gray-200 rounded-lg p-3 bg-white">
              {/* Column 1 - Personal Details */}
              <div className="flex flex-col sm:border-r border-gray-200 pr-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Emp. Code</span>
                  <span>{payslipData.employeeId}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Emp. Name</span>
                  <span>{payslipData.employeeName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Designation</span>
                  <span>{payslipData.designation}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-gray-700">Department</span>
                  <span>{payslipData.department}</span>
                </div>
              </div>

              {/* Column 2 - Employment Details */}
              <div className="flex flex-col sm:border-r border-gray-200 pr-2 mt-3 sm:mt-0">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Joining Date</span>
                  <span>{formatDate(payslipData.doj)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">UAN No</span>
                  <span>{payslipData.uanNo}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-gray-700">ESIC No</span>
                  <span>{payslipData.esicNo || "--"}</span>
                </div>
              </div>

              {/* Column 3 - Bank Details */}
              <div className="flex flex-col mt-3 sm:mt-0">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Bank Name</span>
                  <span>{payslipData.bankName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">IFSC Code</span>
                  <span>{payslipData.ifscCode}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-gray-700">Account No.</span>
                  <span>{payslipData.bankAccountNo}</span>
                </div>
              </div>
            </div>

            {/* Total Days and Day Paid */}
            <div className="flex justify-between mb-3 text-sm bg-amber-50 p-2 rounded border border-amber-200">
              <div className="flex flex-col sm:flex-row sm:gap-6">
                <div>
                  <span className="font-semibold text-gray-700">Total Days:</span>
                  <span className="ml-1">{payslipData.workingDays}</span>
                </div>
                <div className="mt-1 sm:mt-0">
                  <span className="font-semibold text-gray-700">Day Paid:</span>
                  <span className="ml-1">{payslipData.workingDays}</span>
                </div>
              </div>
            </div>

            {/* Earnings and Deductions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Earnings */}
              <div className="border rounded-md overflow-hidden shadow-sm border-amber-200">
                <div className="bg-black py-2 px-3 font-bold text-center text-sm text-amber-400">Earnings</div>
                <div className="p-2 overflow-x-auto">
                  <table className="w-full text-sm table-fixed">
                    <thead>
                      <tr className="border-b bg-amber-50">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Component</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">Basic</td>
                        <td className="text-right py-2 px-3 font-medium">{formatCurrency(payslipData.basic)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">HRA</td>
                        <td className="text-right py-2 px-3 font-medium">{formatCurrency(payslipData.hra)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">Bonus Gross</td>
                        <td className="text-right py-2 px-3 font-medium">
                          {formatCurrency(payslipData.statutoryBonus)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">
                          Arrear ({formatValue(payslipData.arrearsDays, "0")} days)
                        </td>
                        <td className="text-right py-2 px-3 font-medium">
                          {formatCurrency(payslipData.arrearsAmount)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">
                          Over Time ({formatValue(payslipData.otHrs, "0")} hrs)
                        </td>
                        <td className="text-right py-2 px-3 font-medium">{formatCurrency(payslipData.otAmount)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">
                          Extra Days ({formatValue(payslipData.extraDays, "0")} days)
                        </td>
                        <td className="text-right py-2 px-3 font-medium">
                          {formatCurrency(payslipData.extraHolidayPay)}
                        </td>
                      </tr>

                      {/* Incentives Subsection */}
                      <tr className="bg-amber-50">
                        <td colSpan={2} className="py-2 px-3 font-semibold text-center text-gray-700">
                          Incentives
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 pl-5 border-r border-amber-100">Attendance Incentive</td>
                        <td className="text-right py-2 px-3 font-medium">
                          {formatCurrency(payslipData.attendanceIncentive)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 pl-5 border-r border-amber-100">Performance Incentive</td>
                        <td className="text-right py-2 px-3 font-medium">
                          {formatCurrency(payslipData.performanceIncentive)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 pl-5 border-r border-amber-100">Special Incentive</td>
                        <td className="text-right py-2 px-3 font-medium">
                          {formatCurrency(payslipData.specialIncentive)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deductions - Always show ESIC */}
              <div className="border rounded-md overflow-hidden shadow-sm border-amber-200">
                <div className="bg-black py-2 px-3 font-bold text-center text-sm text-amber-400">Deductions</div>
                <div className="p-2 overflow-x-auto">
                  <table className="w-full text-sm table-fixed">
                    <thead>
                      <tr className="border-b bg-amber-50">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Component</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">PF Employee</td>
                        <td className="text-right py-2 px-3 font-medium">{formatCurrency(payslipData.pfAmount)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">Professional Tax</td>
                        <td className="text-right py-2 px-3 font-medium">
                          {formatCurrency(payslipData.professionTax)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">Karma Life</td>
                        <td className="text-right py-2 px-3 font-medium">{formatCurrency(payslipData.karmaLife)}</td>
                      </tr>
                      {/* Always show ESIC */}
                      <tr className="border-b">
                        <td className="py-2 px-3 border-r border-amber-100">ESIC</td>
                        <td className="text-right py-2 px-3 font-medium">{formatCurrency(payslipData.esic)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Total Earning, Deduction, and Net Pay */}
            <div className="bg-amber-50 p-3 rounded-lg text-sm mb-3 shadow-sm border border-amber-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex justify-between font-semibold text-gray-700">
                  <span>Total Earning:</span>
                  <span>{formatCurrency(payslipData.totalGrossA)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-700">
                  <span>Total Deduction:</span>
                  <span>{formatCurrency(payslipData.grossDeductionB)}</span>
                </div>
              </div>
              <div className="h-px bg-amber-300 my-2"></div>
              <div className="flex justify-between font-bold text-base text-black">
                <span>Net Pay:</span>
                <span className="text-amber-700">{formatCurrency(payslipData.netTakeHome)}</span>
              </div>
              {/*<div className="mt-2 text-xs text-gray-600 italic">
                <span>In words: </span>
                <span className="capitalize">{payslipData.netPayWords}</span>
              </div>*/}
            </div>

            {/* UTR Number */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm mt-auto">
              {/*<p className="font-semibold text-gray-700 mb-1 sm:mb-0">UTR No. {payslipData.UTRNo || "N/A"}</p>*/}
              <p className="italic text-gray-500 text-xs">
                *This is a computer generated statement and does not require signature.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

