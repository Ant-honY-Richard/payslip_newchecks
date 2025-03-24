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
}

export default function PayslipPage() {
  const searchParams = useSearchParams()
  const employeeId = searchParams.get("id")
  const month = searchParams.get("month")

  const [payslipData, setPayslipData] = useState<PayslipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientName, setClientName] = useState("ADJ Utility Apps Private Limited")

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
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to fetch payslip")
        }

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
      // Add a class to improve PDF rendering
      payslipElement.classList.add("generating-pdf")

      const canvas = await html2canvas(payslipElement, {
        scale: 2, // Higher scale for better quality
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

      const imgData = canvas.toDataURL("image/png")

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Add image to fit exactly on A4 page
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297) // A4 dimensions in mm

      pdf.save(`Payslip_${employeeId}_${month}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-2 sm:p-4 md:p-8 a4-container">
      <div className="max-w-[210mm] mx-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button size="sm" onClick={generatePDF}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        </div>

        <div
          id="payslip"
          className="bg-white rounded-lg shadow-lg border print:shadow-none print:border-0 relative w-full max-w-[210mm] mx-auto aspect-[1/1.414] print:w-[210mm] print:h-[297mm]"
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="relative w-64 h-64 opacity-10">
              <Image src="/images/logo.png" alt="Watermark" fill style={{ objectFit: "contain" }} />
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-4 sm:p-6 h-400% flex flex-col">
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl font-bold text-primary">Newchecks Solutions Pvt. Ltd</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              #428, 2nd floor 8th block Koramangala, Bangalore, Karnataka- 560095.
              </p>
            </div>

            <div className="bg-primary/10 py-2 px-4 rounded-md flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-sm sm:text-lg font-semibold">Payslip for the month: {displayMonth}</h2>
              <p className="text-xs sm:text-sm">Client Name: {clientName}</p>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 sm:mb-6 text-xs sm:text-sm border border-gray-200 rounded-lg p-3">
  {/* Column 1 */}
  <div className="flex flex-col space-y-2 border-r border-gray-200 pr-4">
    <div className="flex justify-between">
      <span className="font-medium">Emp. Code</span>
      <span>{payslipData.employeeId}</span>
    </div>
    <div className="flex justify-between">
      <span className="font-medium">Joining Date</span>
      <span>{payslipData.doj}</span>
    </div>
    <div className="flex justify-between">
      <span className="font-medium">ESIC No</span>
      <span>{payslipData.esicNo || "--"}</span>
    </div>
  </div>

  {/* Column 2 */}
  <div className="flex flex-col space-y-2 border-r border-gray-200 pr-4">
    <div className="flex justify-between">
      <span className="font-medium">Emp. Name</span>
      <span>{payslipData.employeeName}</span>
    </div>
    <div className="flex justify-between">
      <span className="font-medium">Location</span>
      <span>Bangalore</span>
    </div>
    <div className="flex justify-between">
      <span className="font-medium">UAN No</span>
      <span>{payslipData.uanNo}</span>
    </div>
  </div>

  {/* Column 3 */}
  <div className="flex flex-col space-y-2">
    <div className="flex justify-between">
      <span className="font-medium">Designation</span>
      <span>{payslipData.designation}</span>
    </div>
  </div>
</div>
            {/* Bank Details */}
            <div className="mb-4 sm:mb-6 text-xs sm:text-sm border border-gray-200 rounded-lg p-3">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Bank Name</span>
                  <span>{payslipData.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">IFSC Code</span>
                  <span>{payslipData.ifscCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Account No.</span>
                  <span>{payslipData.bankAccountNo}</span>
                </div>
              </div>
            </div>

            {/* Total Days and Day Paid */}
            <div className="flex justify-between mb-4 sm:mb-6 text-xs sm:text-sm bg-gray-100 p-2 rounded border border-gray-200">
              <div className="flex gap-4">
                <div>
                  <span className="font-medium">Total Days:</span>
                  <span className="ml-1">{payslipData.workingDays}</span>
                </div>
                <div>
                  <span className="font-medium">Day Paid:</span>
                  <span className="ml-1">{payslipData.workingDays}</span>
                </div>
              </div>
            </div>

            {/* Earnings and Deductions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 sm:mb-6">
  {/* Earnings */}
  <div className="border rounded-md overflow-hidden">
    <div className="bg-primary/10 py-2 px-4 font-semibold text-center text-xs sm:text-sm">Earnings</div>
    <div className="p-2 overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 font-medium">Header</th>
            <th className="text-right py-1 font-medium">Actual</th>
            <th className="text-right py-1 font-medium">Salary</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-1.5">Basic</td>
            <td className="text-right py-1.5">₹{payslipData.basic}</td>
            <td className="text-right py-1.5">₹{payslipData.basic}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">HRA</td>
            <td className="text-right py-1.5">₹{payslipData.hra}</td>
            <td className="text-right py-1.5">₹{payslipData.hra}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">Bonus Gross</td>
            <td className="text-right py-1.5">₹{payslipData.statutoryBonus}</td>
            <td className="text-right py-1.5">₹{payslipData.statutoryBonus}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">Lunch/Food Allowance</td>
            <td className="text-right py-1.5">₹{payslipData.specialAllowance}</td>
            <td className="text-right py-1.5">₹{payslipData.specialAllowance}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">Attendance Allowance</td>
            <td className="text-right py-1.5">₹{payslipData.attendanceIncentive}</td>
            <td className="text-right py-1.5">₹{payslipData.attendanceIncentive}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">Over Time</td>
            <td className="text-right py-1.5">₹0.00</td>
            <td className="text-right py-1.5">₹{payslipData.otAmount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* Deductions */}
  <div className="border rounded-md overflow-hidden">
    <div className="bg-primary/10 py-2 px-4 font-semibold text-center text-xs sm:text-sm">Deductions</div>
    <div className="p-2 overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 font-medium">Header</th>
            <th className="text-right py-1 font-medium">Deducted</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-1.5">PF Employee</td>
            <td className="text-right py-1.5">₹{payslipData.pfAmount}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">Professional Tax</td>
            <td className="text-right py-1.5">₹{payslipData.professionTax}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">Additional Mediclaim Premium</td>
            <td className="text-right py-1.5">₹{payslipData.karmaLife}</td>
          </tr>
          {payslipData.esic !== "0" && (
            <tr className="border-b">
              <td className="py-1.5">ESIC</td>
              <td className="text-right py-1.5">₹{payslipData.esic}</td>
            </tr>
          )}
          {/* Add empty rows to match height with earnings table */}
          <tr className="border-b">
            <td className="py-1.5"></td>
            <td className="text-right py-1.5"></td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5"></td>
            <td className="text-right py-1.5"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

            {/* Total Earning, Deduction, and Net Pay */}
            <div className="bg-gray-100 p-3 rounded-lg text-xs sm:text-sm mb-4 sm:mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between font-medium">
                  <span>Total Earning :</span>
                  <span>₹{payslipData.totalGrossA}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Deduction :</span>
                  <span>₹{payslipData.grossDeductionB}</span>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Net Pay :</span>
                <span>₹{payslipData.netTakeHome}</span>
              </div>
            </div>

            {/* UTR Number */}
            <div className="text-xs sm:text-sm mt-auto">
              <p className="font-medium">UTR No. N181243120625518</p>
            </div>

            {/* Footer Note */}
            <div className="mt-3 text-center text-xs text-muted-foreground">
              <p className="italic">*This is a computer generated statement and does not require signature.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}