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
  Building,
  Trash2,
  Plus,
  Check,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as XLSX from "xlsx"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

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

interface Client {
  _id: string
  name: string
  address?: string
  contactPerson?: string
  email?: string
  phone?: string
  isDefault: boolean
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
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
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
  const [clientPagination, setClientPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMonth, setFilterMonth] = useState("")

  // New client form
  const [newClientName, setNewClientName] = useState("")
  const [newClientAddress, setNewClientAddress] = useState("")
  const [newClientContactPerson, setNewClientContactPerson] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [newClientIsDefault, setNewClientIsDefault] = useState(false)
  const [isAddingClient, setIsAddingClient] = useState(false)

  // Delete states
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [selectedPayslips, setSelectedPayslips] = useState<{ employeeId: string; month: string; year: string }[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"employee" | "payslip" | "client">("employee")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isBulkDelete, setIsBulkDelete] = useState(false)

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
    } else if (activeTab === "clients") {
      fetchClients(clientPagination.currentPage, searchTerm)
    }
  }, [
    activeTab,
    employeePagination.currentPage,
    payslipPagination.currentPage,
    clientPagination.currentPage,
    searchTerm,
    filterMonth,
  ])

  // Fetch clients on initial load
  useEffect(() => {
    fetchClients()
  }, [])

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

  const fetchClients = async (page = 1, search = "") => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients?page=${page}&limit=10&search=${search}`)
      const data = await response.json()

      if (data.success) {
        setClients(data.data)
        setClientPagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.total,
        })

        // Set the default client if no client is selected
        if (!selectedClient && data.data.length > 0) {
          const defaultClient = data.data.find((client: Client) => client.isDefault)
          if (defaultClient) {
            setSelectedClient(defaultClient._id)
          } else if (data.data[0]) {
            setSelectedClient(data.data[0]._id)
          }
        }
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to fetch clients",
        })
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      setStatus({
        type: "error",
        message: "Failed to fetch clients. Please try again.",
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

    if (!selectedClient) {
      setStatus({
        type: "error",
        message: "Please select a client first",
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
          clientId: selectedClient,

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
          clientId: selectedClient,
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
    } else if (activeTab === "clients") {
      setClientPagination({ ...clientPagination, currentPage: 1 })
      fetchClients(1, searchTerm)
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

  const handleAddClient = async () => {
    if (!newClientName.trim()) {
      setStatus({
        type: "error",
        message: "Client name is required",
      })
      return
    }

    try {
      setIsAddingClient(true)
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newClientName,
          address: newClientAddress,
          contactPerson: newClientContactPerson,
          email: newClientEmail,
          phone: newClientPhone,
          isDefault: newClientIsDefault,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add client")
      }

      // Success message
      setStatus({
        type: "success",
        message: "Client added successfully",
      })

      // Reset form
      setNewClientName("")
      setNewClientAddress("")
      setNewClientContactPerson("")
      setNewClientEmail("")
      setNewClientPhone("")
      setNewClientIsDefault(false)

      // Refresh clients
      fetchClients()
    } catch (error) {
      console.error("Error adding client:", error)
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to add client",
      })
    } finally {
      setIsAddingClient(false)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === "employee") {
        if (isBulkDelete) {
          // Bulk delete employees
          for (const employeeId of selectedEmployees) {
            await fetch(`/api/employees/${employeeId}`, {
              method: "DELETE",
            })
          }
          setStatus({
            type: "success",
            message: `${selectedEmployees.length} employees deleted successfully`,
          })
          setSelectedEmployees([])
        } else if (deleteTarget) {
          // Single delete employee
          const response = await fetch(`/api/employees/${deleteTarget}`, {
            method: "DELETE",
          })
          const result = await response.json()
          if (!response.ok || !result.success) {
            throw new Error(result.error || "Failed to delete employee")
          }
          setStatus({
            type: "success",
            message: "Employee deleted successfully",
          })
        }
        fetchEmployees(employeePagination.currentPage, searchTerm)
      } else if (deleteType === "payslip") {
        if (isBulkDelete) {
          // Bulk delete payslips
          const employeeIds = selectedPayslips.map((p) => p.employeeId)
          const months = selectedPayslips.map((p) => p.month)
          const years = selectedPayslips.map((p) => p.year)

          const response = await fetch(`/api/payslips/delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              employeeIds,
              months,
              years,
            }),
          })

          const result = await response.json()
          if (!response.ok || !result.success) {
            throw new Error(result.error || "Failed to delete payslips")
          }

          setStatus({
            type: "success",
            message: `${result.deletedCount} payslips deleted successfully`,
          })
          setSelectedPayslips([])
        } else if (deleteTarget) {
          // Single delete payslip
          const [employeeId, month, year] = deleteTarget.split(":")
          const response = await fetch(`/api/payslips/delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              employeeIds: [employeeId],
              months: [month],
              years: [year],
            }),
          })

          const result = await response.json()
          if (!response.ok || !result.success) {
            throw new Error(result.error || "Failed to delete payslip")
          }

          setStatus({
            type: "success",
            message: "Payslip deleted successfully",
          })
        }
        fetchPayslips(payslipPagination.currentPage, filterMonth)
      } else if (deleteType === "client") {
        if (deleteTarget) {
          // Delete client
          const response = await fetch(`/api/clients/${deleteTarget}`, {
            method: "DELETE",
          })
          const result = await response.json()
          if (!response.ok || !result.success) {
            throw new Error(result.error || "Failed to delete client")
          }
          setStatus({
            type: "success",
            message: "Client deleted successfully",
          })
          fetchClients(clientPagination.currentPage, searchTerm)
        }
      }
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error)
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : `Failed to delete ${deleteType}`,
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteTarget(null)
      setIsBulkDelete(false)
    }
  }

  const handleSetDefaultClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isDefault: true,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to set default client")
      }

      setStatus({
        type: "success",
        message: "Default client updated successfully",
      })

      fetchClients(clientPagination.currentPage, searchTerm)
    } catch (error) {
      console.error("Error setting default client:", error)
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to set default client",
      })
    }
  }

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId)
      } else {
        return [...prev, employeeId]
      }
    })
  }

  const togglePayslipSelection = (payslip: { employeeId: string; month: string; year: string }) => {
    setSelectedPayslips((prev) => {
      const exists = prev.some(
        (p) => p.employeeId === payslip.employeeId && p.month === payslip.month && p.year === payslip.year,
      )

      if (exists) {
        return prev.filter(
          (p) => !(p.employeeId === payslip.employeeId && p.month === payslip.month && p.year === payslip.year),
        )
      } else {
        return [...prev, payslip]
      }
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
              <TabsList className="grid w-full grid-cols-4">
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
                <TabsTrigger value="clients" className="flex items-center text-xs sm:text-sm">
                  <Building className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Clients
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
                  <Label htmlFor="client" className="text-xs sm:text-sm">
                    Select Client
                  </Label>
                  <Select onValueChange={setSelectedClient} value={selectedClient}>
                    <SelectTrigger id="client" className="text-xs sm:text-sm">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client._id} value={client._id} className="text-xs sm:text-sm">
                          {client.name} {client.isDefault ? "(Default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                  disabled={!file || !selectedMonth || !selectedClient || isProcessing}
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
                <div className="mb-4 flex justify-between items-end">
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

                  <div className="flex gap-2">
                    {selectedEmployees.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setDeleteType("employee")
                          setIsBulkDelete(true)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete Selected ({selectedEmployees.length})
                      </Button>
                    )}
                  </div>
                </div>

                <div className="rounded-md border">
                  <ScrollArea className="h-[400px] sm:h-auto">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 text-xs">
                              <Checkbox
                                checked={employees.length > 0 && selectedEmployees.length === employees.length}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEmployees(employees.map((e) => e.employeeId))
                                  } else {
                                    setSelectedEmployees([])
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead className="text-xs">ID</TableHead>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs">Mobile</TableHead>
                            <TableHead className="text-xs">Department</TableHead>
                            <TableHead className="text-xs">Designation</TableHead>
                            <TableHead className="text-xs">Updated</TableHead>
                            <TableHead className="text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
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
                              <TableCell colSpan={8} className="text-center py-8">
                                <p className="text-muted-foreground text-xs sm:text-sm">No employees found</p>
                                {searchTerm && <p className="text-xs mt-1">Try adjusting your search criteria</p>}
                              </TableCell>
                            </TableRow>
                          ) : (
                            employees.map((employee) => (
                              <TableRow key={employee.employeeId}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedEmployees.includes(employee.employeeId)}
                                    onCheckedChange={() => toggleEmployeeSelection(employee.employeeId)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium text-xs">{employee.employeeId}</TableCell>
                                <TableCell className="text-xs">{employee.employeeName}</TableCell>
                                <TableCell className="text-xs">{employee.mobileNumber}</TableCell>
                                <TableCell className="text-xs">{employee.department}</TableCell>
                                <TableCell className="text-xs">{employee.designation}</TableCell>
                                <TableCell className="text-xs">{formatDate(employee.updatedAt)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500"
                                    onClick={() => {
                                      setDeleteType("employee")
                                      setDeleteTarget(employee.employeeId)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </TableCell>
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
                <div className="mb-4 flex justify-between items-end">
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

                  <div className="flex gap-2">
                    {selectedPayslips.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setDeleteType("payslip")
                          setIsBulkDelete(true)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete Selected ({selectedPayslips.length})
                      </Button>
                    )}
                  </div>
                </div>

                <div className="rounded-md border">
                  <ScrollArea className="h-[400px] sm:h-auto">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 text-xs">
                              <Checkbox
                                checked={payslips.length > 0 && selectedPayslips.length === payslips.length}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPayslips(
                                      payslips.map((p) => ({
                                        employeeId: p.employeeId,
                                        month: p.month,
                                        year: p.year,
                                      })),
                                    )
                                  } else {
                                    setSelectedPayslips([])
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead className="text-xs">ID</TableHead>
                            <TableHead className="text-xs">Month</TableHead>
                            <TableHead className="text-xs">Year</TableHead>
                            <TableHead className="text-xs">Net Pay</TableHead>
                            <TableHead className="text-xs">Created</TableHead>
                            <TableHead className="text-xs">Updated</TableHead>
                            <TableHead className="text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading payslip data...</p>
                              </TableCell>
                            </TableRow>
                          ) : payslips.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                <p className="text-muted-foreground text-xs sm:text-sm">No payslips found</p>
                                {filterMonth && <p className="text-xs mt-1">Try selecting a different month</p>}
                              </TableCell>
                            </TableRow>
                          ) : (
                            payslips.map((payslip, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedPayslips.some(
                                      (p) =>
                                        p.employeeId === payslip.employeeId &&
                                        p.month === payslip.month &&
                                        p.year === payslip.year,
                                    )}
                                    onCheckedChange={() =>
                                      togglePayslipSelection({
                                        employeeId: payslip.employeeId,
                                        month: payslip.month,
                                        year: payslip.year,
                                      })
                                    }
                                  />
                                </TableCell>
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
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500"
                                    onClick={() => {
                                      setDeleteType("payslip")
                                      setDeleteTarget(`${payslip.employeeId}:${payslip.month}:${payslip.year}`)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </TableCell>
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

              <TabsContent value="clients" className="mt-4">
                <div className="mb-4 flex justify-between items-end">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      placeholder="Search by client name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 text-xs sm:text-sm"
                    />
                    <Button type="submit" variant="secondary" className="text-xs sm:text-sm">
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />{" "}
                      <span className="hidden sm:inline">Search</span>
                    </Button>
                  </form>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                        <DialogDescription>
                          Add a new client to the system. This client will be available for selection when uploading
                          payslips.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="clientName">Client Name *</Label>
                          <Input
                            id="clientName"
                            placeholder="Enter client name"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="clientAddress">Address</Label>
                          <Textarea
                            id="clientAddress"
                            placeholder="Enter client address"
                            value={newClientAddress}
                            onChange={(e) => setNewClientAddress(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contactPerson">Contact Person</Label>
                            <Input
                              id="contactPerson"
                              placeholder="Contact person name"
                              value={newClientContactPerson}
                              onChange={(e) => setNewClientContactPerson(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              placeholder="Phone number"
                              value={newClientPhone}
                              onChange={(e) => setNewClientPhone(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Email address"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isDefault"
                            checked={newClientIsDefault}
                            onCheckedChange={(checked) => setNewClientIsDefault(!!checked)}
                          />
                          <Label htmlFor="isDefault" className="text-sm">
                            Set as default client
                          </Label>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setNewClientName("")
                            setNewClientAddress("")
                            setNewClientContactPerson("")
                            setNewClientEmail("")
                            setNewClientPhone("")
                            setNewClientIsDefault(false)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddClient} disabled={isAddingClient || !newClientName.trim()}>
                          {isAddingClient ? "Adding..." : "Add Client"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="rounded-md border">
                  <ScrollArea className="h-[400px] sm:h-auto">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs">Address</TableHead>
                            <TableHead className="text-xs">Contact</TableHead>
                            <TableHead className="text-xs">Default</TableHead>
                            <TableHead className="text-xs">Created</TableHead>
                            <TableHead className="text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading client data...</p>
                              </TableCell>
                            </TableRow>
                          ) : clients.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <p className="text-muted-foreground text-xs sm:text-sm">No clients found</p>
                                {searchTerm && <p className="text-xs mt-1">Try adjusting your search criteria</p>}
                              </TableCell>
                            </TableRow>
                          ) : (
                            clients.map((client) => (
                              <TableRow key={client._id}>
                                <TableCell className="font-medium text-xs">{client.name}</TableCell>
                                <TableCell className="text-xs">{client.address || "-"}</TableCell>
                                <TableCell className="text-xs">
                                  {client.contactPerson ? `${client.contactPerson}` : ""}
                                  {client.phone ? (client.contactPerson ? ` (${client.phone})` : client.phone) : ""}
                                  {!client.contactPerson && !client.phone ? "-" : ""}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {client.isDefault ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => handleSetDefaultClient(client._id)}
                                    >
                                      Set Default
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs">{formatDate(client.createdAt)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500"
                                    onClick={() => {
                                      setDeleteType("client")
                                      setDeleteTarget(client._id)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                    disabled={client.isDefault}
                                    title={client.isDefault ? "Cannot delete default client" : "Delete client"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>

                {clientPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Showing {clients.length} of {clientPagination.totalItems} clients
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setClientPagination({
                            ...clientPagination,
                            currentPage: Math.max(1, clientPagination.currentPage - 1),
                          })
                        }
                        disabled={clientPagination.currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs sm:text-sm">
                        Page {clientPagination.currentPage} of {clientPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setClientPagination({
                            ...clientPagination,
                            currentPage: Math.min(clientPagination.totalPages, clientPagination.currentPage + 1),
                          })
                        }
                        disabled={clientPagination.currentPage === clientPagination.totalPages}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              {isBulkDelete
                ? `Are you sure you want to delete ${deleteType === "employee" ? selectedEmployees.length + " employees" : selectedPayslips.length + " payslips"}?`
                : `Are you sure you want to delete this ${deleteType}?`}
              {deleteType === "employee" && " This will also delete all associated payslips."}
              {" This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

