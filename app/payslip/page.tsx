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
import { formatDateToDDMMYYYY } from '@/utils/dateFormatter';

// Add styles for PDF generation and printing
const pdfStyles = `
  @media print, .generating-pdf {
    body {
      margin: 0;
      padding: 0;
    }

    .payslip-container {
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
    }

    #payslip {
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      width: 210mm !important;
      height: auto !important;
      min-height: 0 !important;
    }

    .print-hidden {
      display: none !important;
    }

    .payslip-month {
      background-color: rgba(59, 130, 246, 0.15) !important;
      font-weight: bold !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
    }
  }
`;

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

        // Format dates when setting the data
// In your fetchPayslip function:
setPayslipData({
  ...result.data,
  doj: result.data.doj ? formatDateToDDMMYYYY(result.data.doj) : '--',
  dob: result.data.dob ? formatDateToDDMMYYYY(result.data.dob) : '--',
  // Ensure other fields have fallbacks
  basic: result.data.basic || '0',
  hra: result.data.hra || '0',
  statutoryBonus: result.data.statutoryBonus || '0',
  specialAllowance: result.data.specialAllowance || '0',
  otAmount: result.data.otAmount || '0',
  extraHolidayPay: result.data.extraHolidayPay || '0',
  attendanceIncentive: result.data.attendanceIncentive || '0',
  performanceIncentive: result.data.performanceIncentive || '0',
  specialIncentive: result.data.specialIncentive || '0',
  pfAmount: result.data.pfAmount || '0',
  professionTax: result.data.professionTax || '0',
  karmaLife: result.data.karmaLife || '0',
  esic: result.data.esic || '0',
  totalGrossA: result.data.totalGrossA || '0',
  grossDeductionB: result.data.grossDeductionB || '0',
  netTakeHome: result.data.netTakeHome || '0'
});
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
  const payslipElement = document.getElementById("payslip");
  if (!payslipElement) return;

  try {
    alert("Generating PDF, please wait...");

    // Apply class for styling adjustments
    payslipElement.classList.add("generating-pdf");

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(payslipElement, {
      scale: 3, // Higher scale for better quality
      logging: false,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: payslipElement.scrollWidth,
      windowHeight: payslipElement.scrollHeight,
    });

    payslipElement.classList.remove("generating-pdf");

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    pdf.save(`Payslip_${payslipData?.employeeName}_${displayMonth}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
};


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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-2 sm:p-4 md:p-8 payslip-container">
      {/* Add style tag for PDF and print styles */}
      <style dangerouslySetInnerHTML={{ __html: pdfStyles }} />

      <div className="max-w-[210mm] mx-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6 print-hidden">
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
          <div className="relative z-10 p-2 sm:p-4 h-400% flex flex-col">
            {/* Header with Logo - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-3 sm:mb-4">
              <div className="flex items-center mb-2 sm:mb-0">
                <Image
                  src="/images/header_logo.png"
                  alt="Newchecks Solutions"
                  width={70}
                  height={70}
                  className="object-contain mr-3"
                />
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-primary">Newchecks Solutions Pvt. Ltd</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {payslipData.clientAddress || "#428, 2nd floor 8th block Koramangala, Bangalore, Karnataka- 560095."}
                  </p>
                </div>
              </div>
              <div className="text-center sm:text-right text-sm sm:text-base">
                <p className="font-bold bg-primary/10 px-2 py-1 rounded payslip-month">Payslip: {displayMonth}</p>
                <p className="font-medium mt-1">Client: {payslipData.clientName}</p>
              </div>
            </div>

            {/* Employee and Bank Details - Mobile Responsive Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm border border-gray-200 rounded-lg p-3">
              {/* Column 1 - Personal Details */}
              <div className="flex flex-col sm:border-r border-gray-200 pr-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold">Emp. Code</span>
                  <span>{payslipData.employeeId}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold">Emp. Name</span>
                  <span>{payslipData.employeeName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold">Designation</span>
                  <span>{payslipData.designation}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold">Department</span>
                  <span>{payslipData.department}</span>
                </div>
              </div>

  {/* Column 2 - Employment Details */}
  <div className="flex flex-col sm:border-r border-gray-200 pr-2 mt-3 sm:mt-0">
    <div className="flex justify-between py-2 border-b">
      <span className="font-semibold">Joining Date</span>
      <span>{payslipData.doj || "--"}</span>
    </div>
    <div className="flex justify-between py-2 border-b">
      <span className="font-semibold">Date of Birth</span>
      <span>{payslipData.dob || "--"}</span>
    </div>
    <div className="flex justify-between py-2 border-b">
      <span className="font-semibold">UAN No</span>
      <span>{payslipData.uanNo || "--"}</span>
    </div>
    <div className="flex justify-between py-2">
      <span className="font-semibold">ESIC No</span>
      <span>{payslipData.esicNo || "--"}</span>
    </div>
  </div>

  {/* Column 3 - Bank Details */}
  <div className="flex flex-col mt-3 sm:mt-0">
    <div className="flex justify-between py-2 border-b">
      <span className="font-semibold">Bank Name</span>
      <span>{payslipData.bankName || "--"}</span>
    </div>
    <div className="flex justify-between py-2 border-b">
      <span className="font-semibold">IFSC Code</span>
      <span>{payslipData.ifscCode || "--"}</span>
    </div>
    <div className="flex justify-between py-2">
      <span className="font-semibold">Account No.</span>
      <span>{payslipData.bankAccountNo || "--"}</span>
    </div>
  </div>
</div>

            {/* Total Days and Day Paid */}
            <div className="flex justify-between mb-3 text-sm bg-gray-100 p-2 rounded border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:gap-6">
                <div>
                  <span className="font-semibold">Total Days:</span>
                  <span className="ml-1">{payslipData.workingDays}</span>
                </div>
                <div className="mt-1 sm:mt-0">
                  <span className="font-semibold">Day Paid:</span>
                  <span className="ml-1">{payslipData.workingDays}</span>
                </div>
              </div>
            </div>

{/* Earnings and Deductions */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Earnings */}
              <div className="border rounded-md overflow-hidden">
                <div className="bg-primary/10 py-2 px-3 font-bold text-center text-sm">Earnings</div>
                <div className="p-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 font-semibold">Component</th>
                        <th className="text-right py-1 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1">Basic</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.basic}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">HRA</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.hra}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Bonus Gross</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.statutoryBonus}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Lunch/Food Allowance</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.specialAllowance}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Over Time ({payslipData.otHrs} hrs)</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.otAmount}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Extra & Holiday Pay ({payslipData.extraDays} days)</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.extraHolidayPay}</td>
                      </tr>

                      {/* Incentives Subsection */}
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="py-1 font-semibold text-center">
                          Incentives
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 pl-2">Attendance Incentive</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.attendanceIncentive}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 pl-2">Performance Incentive</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.performanceIncentive}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1 pl-2">Special Incentive</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.specialIncentive}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deductions */}
              <div className="border rounded-md overflow-hidden">
                <div className="bg-primary/10 py-2 px-3 font-bold text-center text-sm">Deductions</div>
                <div className="p-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 font-semibold">Component</th>
                        <th className="text-right py-1 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1">PF Employee</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.pfAmount}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Professional Tax</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.professionTax}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Karma Life</td>
                        <td className="text-right py-1 font-medium">₹{payslipData.karmaLife}</td>
                      </tr>
                      {payslipData.esic !== "0" && (
                        <tr className="border-b">
                          <td className="py-1">ESIC</td>
                          <td className="text-right py-1 font-medium">₹{payslipData.esic}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Total Earning, Deduction, and Net Pay */}
            <div className="bg-gray-100 p-3 rounded-lg text-sm mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex justify-between font-semibold">
                  <span>Total Earning :</span>
                  <span>₹{payslipData.totalGrossA}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Deduction :</span>
                  <span>₹{payslipData.grossDeductionB}</span>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Net Pay :</span>
                <span>₹{payslipData.netTakeHome}</span>
              </div>
            </div>

            {/* UTR Number and Footer Note */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm mt-2">
              <p className="font-semibold mb-1 sm:mb-0">UTR No. N181243120625518</p>
              <p className="italic text-muted-foreground">*This is a computer generated statement and does not require signature.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}