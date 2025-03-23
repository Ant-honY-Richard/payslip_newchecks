"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  FileSpreadsheet,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  FileUp,
  Users,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as XLSX from "xlsx"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Employee {
  employeeId: string
  employeeName: string
  mobileNumber: string
  department: string
  designation: string
  createdAt?: string
  updatedAt?: string
}

interface Payslip {
  employeeId: string
  employeeName?: string
  month: string
  year: string
  netTakeHome: string
  createdAt?: string
  updatedAt?: string
}

interface PaginationState {
  currentPage: number
  totalPages: number
  totalItems: number
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error" | "info" | null; message: string }>({
    type: null,
    message: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Data view states
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [employeePagination, setEmployeePagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  const [payslipPagination, setPayslipPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMonth, setFilterMonth] = useState("")

  // Generate months including current month for admin
  const months = Array.from({ length: 13 }, (_, i) => {
    const date = new Date()
    // Start from current month (i because we include current month)
    date.setMonth(date.getMonth() - i)
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString("default", { month: "long", year: "numeric" }),
    }
  })

  // Fetch employees when tab changes or search/pagination changes
  useEffect(() => {
    if (activeTab === "employees") {
      fetchEmployees(employeePagination.currentPage, searchTerm)
    } else if (activeTab === "payslips") {
      fetchPayslips(payslipPagination.currentPage, filterMonth)
    }
  }, [activeTab, employeePagination.currentPage, payslipPagination.currentPage, searchTerm, filterMonth])

  const fetchEmployees = async (page = 1, search = "") => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/employees?page=${page}&limit=10&search=${search}`)
      const data = await response.json()

      if (data.success) {
        setEmployees(data.data)
        setEmployeePagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.total,
        })
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to fetch employees",
        })
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
      setStatus({
        type: "error",
        message: "Failed to fetch employees. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPayslips = async (page = 1, monthYear = "") => {
    try {
      setIsLoading(true)

      let url = `/api/payslips?page=${page}&limit=10`

      if (monthYear) {
        const [year, month] = monthYear.split("-")
        url += `&month=${month}&year=${year}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setPayslips(data.data)
        setPayslipPagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.total,
        })
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to fetch payslips",
        })
      }
    } catch (error) {
      console.error("Error fetching payslips:", error)
      setStatus({
        type: "error",
        message: "Failed to fetch payslips. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]

      // Check if file is an Excel file
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        setStatus({
          type: "error",
          message: "Please upload only Excel files (.xlsx or .xls)",
        })
        return
      }

      setFile(selectedFile)
      setStatus({ type: null, message: "" })
      setShowPreview(false)
      setPreviewData([])
    }
  }

  const processExcelFile = async () => {
    if (!file) {
      setStatus({
        type: "error",
        message: "Please select an Excel file first",
      })
      return
    }

    if (!selectedMonth) {
      setStatus({
        type: "error",
        message: "Please select a month first",
      })
      return
    }

    setIsProcessing(true)
    setStatus({ type: "info", message: "Processing Excel file..." })

    try {
      // Read the Excel file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)

      // Assume the first sheet contains our data
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Process the data
      const processedData = jsonData.map((row: any) => {
        // Map Excel columns to our data structure
        return {
          employeeId: row["Emp ID"] || "",
          employeeName: row["Employee Name"] || "",
          mobileNumber: row["Mobile Number"] || "", // Added mobile number field
          dob: row["DOB"] || "",
          doj: row["DOJ"] || "",
          designation: row["Designation"] || "",
          department: row["Department"] || "",
          bankName: row["Bank Name"] || "",
          bankAccountNo: row["Bank Account No"] || "",
          ifscCode: row["IFSC code"] || "",
          panNo: row["PAN NO"] || "",
          pfNumber: row["PF Number"] || "",
          workingDays: row["Number of days working"] || "",
          uanNo: row["UAN No"] || "",
          esicNo: row["ESI No"] || "",
          extraDays: row["Extra Days"] || "",
          otHrs: row["OT hrs"] || "",
          arrearsDays: row["Arrears Days"] || "",
          lop: row["LOP"] || "",

          // Earnings
          basic: row["BASIC"] || "",
          hra: row["HRA"] || "",
          specialAllowance: row["Special Allowance"] || "",
          statutoryBonus: row["Statutory Bonus"] || "",
          arrearsAmount: row["Arrears amount"] || "",
          grossEarningsTotal: row["Gross Earnings Total"] || "",
          otAmount: row["OT Amount"] || "",
          extraHolidayPay: row["Extra & Holiday pay"] || "",
          attendanceIncentive: row["Attendance Incentive"] || "",
          performanceIncentive: row["Performance Incentive"] || "",
          specialIncentive: row["Special Incentive"] || "",

          // Deductions
          professionTax: row["Profession Tax"] || "",
          pfAmount: row["PF amount"] || "",
          esic: row["ESIC"] || "",
          arrearDeduction: row["Arrear Deduction"] || "",
          karmaLife: row["Karma Life"] || "",

          // Totals
          totalGrossA: row["Total Gross A"] || "",
          grossDeductionB: row["Gross Deductions B"] || "",
          netTakeHome: row["Take Home"] || "",
          netPayWords: row["Net Pay In Words"] || "",
        }
      })

      // Show preview of first 10 records
      setPreviewData(processedData.slice(0, 10))
      setShowPreview(true)

      // Extract month and year from selectedMonth (format: YYYY-MM)
      const [year, month] = selectedMonth.split("-")

      // Save to MongoDB via API
      const response = await fetch("/api/payslips/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payslips: processedData,
          month,
          year,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save data to database")
      }

      // Success message
      setStatus({
        type: "success",
        message: `Successfully processed ${processedData.length} employee records for ${selectedMonth}. ${result.message}`,
      })
    } catch (error) {
      console.error("Error processing Excel file:", error)
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Error processing Excel file. Please check the format and try again.",
      })
      setShowPreview(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === "employees") {
      setEmployeePagination({ ...employeePagination, currentPage: 1 })
      fetchEmployees(1, searchTerm)
    }
  }

  const handleMonthFilter = (value: string) => {
    setFilterMonth(value)
    setPayslipPagination({ ...payslipPagination, currentPage: 1 })
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary mb-4 sm:mb-8">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold">Admin Dashboard</CardTitle>
            <CardDescription>Manage payslip data and view employee records</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center text-xs sm:text-sm">
                  <FileUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />{" "}
                  <span className="hidden sm:inline">Upload</span> Data
                </TabsTrigger>
                <TabsTrigger value="employees" className="flex items-center text-xs sm:text-sm">
                  <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Employees
                </TabsTrigger>
                <TabsTrigger value="payslips" className="flex items-center text-xs sm:text-sm">
                  <Database className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Payslips
                </TabsTrigger>
              </TabsList>

              {status.type && (
                <Alert
                  variant={status.type === "error" ? "destructive" : status.type === "success" ? "default" : "default"}
                  className="mt-4 text-xs sm:text-sm"
                >
                  <AlertTitle>
                    {status.type === "success" ? "Success" : status.type === "error" ? "Error" : "Processing"}
                  </AlertTitle>
                  <AlertDescription>{status.message}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="upload" className="space-y-4 sm:space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="month" className="text-xs sm:text-sm">
                    Select Month for Data
                  </Label>
                  <Select onValueChange={setSelectedMonth} value={selectedMonth}>
                    <SelectTrigger id="month" className="text-xs sm:text-sm">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value} className="text-xs sm:text-sm">
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file" className="text-xs sm:text-sm">
                    Upload Excel File
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="flex-1 text-xs sm:text-sm"
                    />
                  </div>
                  {file && (
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center mt-1">
                      <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {file.name} (
                      {(file.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                <Button
                  onClick={processExcelFile}
                  disabled={!file || !selectedMonth || isProcessing}
                  className="w-full text-xs sm:text-sm"
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Upload className="mr-2 h-4 w-4" /> Upload to Database
                    </span>
                  )}
                </Button>

                {showPreview && previewData.length > 0 && (
                  <Card className="mt-4 sm:mt-6">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-sm sm:text-base">Data Preview</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Showing first 10 records from the uploaded file
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[300px] sm:h-auto">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">ID</TableHead>
                                <TableHead className="text-xs">Name</TableHead>
                                <TableHead className="text-xs">Mobile</TableHead>
                                <TableHead className="text-xs">Designation</TableHead>
                                <TableHead className="text-xs">Department</TableHead>
                                <TableHead className="text-xs">Basic</TableHead>
                                <TableHead className="text-xs">Net Pay</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewData.map((employee, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium text-xs">{employee.employeeId}</TableCell>
                                  <TableCell className="text-xs">{employee.employeeName}</TableCell>
                                  <TableCell className="text-xs">{employee.mobileNumber}</TableCell>
                                  <TableCell className="text-xs">{employee.designation}</TableCell>
                                  <TableCell className="text-xs">{employee.department}</TableCell>
                                  <TableCell className="text-xs">₹{employee.basic}</TableCell>
                                  <TableCell className="text-xs">₹{employee.netTakeHome}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="flex justify-between p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Showing {previewData.length} of {previewData.length} records
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setShowPreview(false)} className="text-xs">
                        Hide Preview
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="employees" className="mt-4">
                <div className="mb-4">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      placeholder="Search by ID, name, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 text-xs sm:text-sm"
                    />
                    <Button type="submit" variant="secondary" className="text-xs sm:text-sm">
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />{" "}
                      <span className="hidden sm:inline">Search</span>
                    </Button>
                  </form>
                </div>

                <div className="rounded-md border">
                  <ScrollArea className="h-[400px] sm:h-auto">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">ID</TableHead>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs">Mobile</TableHead>
                            <TableHead className="text-xs">Department</TableHead>
                            <TableHead className="text-xs">Designation</TableHead>
                            <TableHead className="text-xs">Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                                  Loading employee data...
                                </p>
                              </TableCell>
                            </TableRow>
                          ) : employees.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <p className="text-muted-foreground text-xs sm:text-sm">No employees found</p>
                                {searchTerm && <p className="text-xs mt-1">Try adjusting your search criteria</p>}
                              </TableCell>
                            </TableRow>
                          ) : (
                            employees.map((employee) => (
                              <TableRow key={employee.employeeId}>
                                <TableCell className="font-medium text-xs">{employee.employeeId}</TableCell>
                                <TableCell className="text-xs">{employee.employeeName}</TableCell>
                                <TableCell className="text-xs">{employee.mobileNumber}</TableCell>
                                <TableCell className="text-xs">{employee.department}</TableCell>
                                <TableCell className="text-xs">{employee.designation}</TableCell>
                                <TableCell className="text-xs">{formatDate(employee.updatedAt)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>

                {employeePagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Showing {employees.length} of {employeePagination.totalItems} employees
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEmployeePagination({
                            ...employeePagination,
                            currentPage: Math.max(1, employeePagination.currentPage - 1),
                          })
                        }
                        disabled={employeePagination.currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs sm:text-sm">
                        Page {employeePagination.currentPage} of {employeePagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEmployeePagination({
                            ...employeePagination,
                            currentPage: Math.min(employeePagination.totalPages, employeePagination.currentPage + 1),
                          })
                        }
                        disabled={employeePagination.currentPage === employeePagination.totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payslips" className="mt-4">
                <div className="mb-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor="filterMonth" className="mb-2 block text-xs sm:text-sm">
                        Filter by Month
                      </Label>
                      <Select onValueChange={handleMonthFilter} value={filterMonth}>
                        <SelectTrigger id="filterMonth" className="text-xs sm:text-sm">
                          <SelectValue placeholder="All months" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs sm:text-sm">
                            All months
                          </SelectItem>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value} className="text-xs sm:text-sm">
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border">
                  <ScrollArea className="h-[400px] sm:h-auto">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">ID</TableHead>
                            <TableHead className="text-xs">Month</TableHead>
                            <TableHead className="text-xs">Year</TableHead>
                            <TableHead className="text-xs">Net Pay</TableHead>
                            <TableHead className="text-xs">Created</TableHead>
                            <TableHead className="text-xs">Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading payslip data...</p>
                              </TableCell>
                            </TableRow>
                          ) : payslips.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <p className="text-muted-foreground text-xs sm:text-sm">No payslips found</p>
                                {filterMonth && <p className="text-xs mt-1">Try selecting a different month</p>}
                              </TableCell>
                            </TableRow>
                          ) : (
                            payslips.map((payslip, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium text-xs">{payslip.employeeId}</TableCell>
                                <TableCell className="text-xs">
                                  {new Date(0, Number.parseInt(payslip.month) - 1).toLocaleString("default", {
                                    month: "long",
                                  })}
                                </TableCell>
                                <TableCell className="text-xs">{payslip.year}</TableCell>
                                <TableCell className="text-xs">₹{payslip.netTakeHome}</TableCell>
                                <TableCell className="text-xs">{formatDate(payslip.createdAt)}</TableCell>
                                <TableCell className="text-xs">{formatDate(payslip.updatedAt)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>

                {payslipPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Showing {payslips.length} of {payslipPagination.totalItems} payslips
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPayslipPagination({
                            ...payslipPagination,
                            currentPage: Math.max(1, payslipPagination.currentPage - 1),
                          })
                        }
                        disabled={payslipPagination.currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs sm:text-sm">
                        Page {payslipPagination.currentPage} of {payslipPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPayslipPagination({
                            ...payslipPagination,
                            currentPage: Math.min(payslipPagination.totalPages, payslipPagination.currentPage + 1),
                          })
                        }
                        disabled={payslipPagination.currentPage === payslipPagination.totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

