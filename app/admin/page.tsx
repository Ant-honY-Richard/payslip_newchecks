"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from "xlsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// Sample EmployeeEditDialog component
const EmployeeEditDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  onSave: () => void;
}> = ({ isOpen, onClose, employeeId, onSave }) => {
  const [employeeData, setEmployeeData] = useState({
    employeeName: "",
    mobileNumber: "",
    department: "",
    designation: "",
  });

  useEffect(() => {
    if (isOpen && employeeId) {
      fetch(`/api/employees/${employeeId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch employee");
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setEmployeeData({
              employeeName: data.data.employeeName || "",
              mobileNumber: data.data.mobileNumber || "",
              department: data.data.department || "",
              designation: data.data.designation || "",
            });
          }
        })
        .catch((error) => console.error("Error fetching employee:", error));
    }
  }, [isOpen, employeeId]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });
      if (!response.ok) throw new Error("Failed to update employee");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving employee:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update the employee details below. Click Save to apply changes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="employeeName">Name</Label>
            <Input
              id="employeeName"
              value={employeeData.employeeName}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, employeeName: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              value={employeeData.mobileNumber}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, mobileNumber: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={employeeData.department}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, department: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              value={employeeData.designation}
              onChange={(e) =>
                setEmployeeData({ ...employeeData, designation: e.target.value })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface Employee {
  employeeId: string;
  employeeName: string;
  mobileNumber: string;
  department: string;
  designation: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Payslip {
  employeeId: string;
  employeeName?: string;
  month: string;
  year: string;
  netTakeHome: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Client {
  _id: string;
  name: string;
  address?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Data view states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [employeePagination, setEmployeePagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [payslipPagination, setPayslipPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [clientPagination, setClientPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // New client form
  const [newClientName, setNewClientName] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientContactPerson, setNewClientContactPerson] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientIsDefault, setNewClientIsDefault] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedPayslips, setSelectedPayslips] = useState<
    { employeeId: string; month: string; year: string }[]
  >([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"employee" | "payslip" | "client">("employee");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // Employee edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<string>("");

  // Generate months including current month for admin
  const months = Array.from({ length: 13 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString("default", { month: "long", year: "numeric" }),
    };
  });

  useEffect(() => {
    if (activeTab === "employees") {
      fetchEmployees(employeePagination.currentPage, searchTerm);
    } else if (activeTab === "payslips") {
      fetchPayslips(payslipPagination.currentPage, filterMonth);
    } else if (activeTab === "clients") {
      fetchClients(clientPagination.currentPage, searchTerm);
    }
  }, [
    activeTab,
    employeePagination.currentPage,
    payslipPagination.currentPage,
    clientPagination.currentPage,
    searchTerm,
    filterMonth,
  ]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchEmployees = async (page = 1, search = "") => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/employees?page=${page}&limit=10&search=${search}`);
      if (!response.ok) throw new Error(`Failed to fetch employees: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
        setEmployeePagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.total,
        });
      } else {
        throw new Error(data.error || "Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to fetch employees",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayslips = async (page = 1, monthYear = "") => {
    try {
      setIsLoading(true);
      let url = `/api/payslips?page=${page}&limit=10`;
      if (monthYear) {
        const [year, month] = monthYear.split("-");
        url += `&month=${month}&year=${year}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch payslips: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setPayslips(data.data);
        setPayslipPagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.total,
        });
      } else {
        throw new Error(data.error || "Failed to fetch payslips");
      }
    } catch (error) {
      console.error("Error fetching payslips:", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to fetch payslips",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async (page = 1, search = "") => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clients?page=${page}&limit=10&search=${search}`);
      if (!response.ok) throw new Error(`Failed to fetch clients: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setClients(data.data);
        setClientPagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.total,
        });
        if (!selectedClient && data.data.length > 0) {
          const defaultClient = data.data.find((client: Client) => client.isDefault);
          setSelectedClient(defaultClient?._id || data.data[0]._id);
        }
      } else {
        throw new Error(data.error || "Failed to fetch clients");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to fetch clients",
      });
      if (clients.length === 0) {
        const defaultClient = {
          _id: "default",
          name: "ADJ Utility Apps Private Limited",
          address: "#428, 2nd floor 8th block Koramangala, Bangalore, Karnataka- 560095",
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setClients([defaultClient]);
        setSelectedClient(defaultClient._id);
        // Persist default client to backend
        await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(defaultClient),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        setStatus({
          type: "error",
          message: "Please upload only Excel files (.xlsx or .xls)",
        });
        return;
      }
      setFile(selectedFile);
      setStatus({ type: null, message: "" });
      setShowPreview(false);
      setPreviewData([]);
    }
  };

  const parseNumeric = (value: any): number => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;
    const parsed = Number.parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculateTotals = (payslipData: any) => {
    const basic = parseNumeric(payslipData.basic);
    const hra = parseNumeric(payslipData.hra);
    const specialAllowance = parseNumeric(payslipData.specialAllowance);
    const statutoryBonus = parseNumeric(payslipData.statutoryBonus);
    const arrearsAmount = parseNumeric(payslipData.arrearsAmount);
    const otAmount = parseNumeric(payslipData.otAmount);
    const extraHolidayPay = parseNumeric(payslipData.extraHolidayPay);
    const attendanceIncentive = parseNumeric(payslipData.attendanceIncentive);
    const performanceIncentive = parseNumeric(payslipData.performanceIncentive);
    const specialIncentive = parseNumeric(payslipData.specialIncentive);

    const professionTax = parseNumeric(payslipData.professionTax);
    const pfAmount = parseNumeric(payslipData.pfAmount);
    const esic = parseNumeric(payslipData.esic);
    const arrearDeduction = parseNumeric(payslipData.arrearDeduction);
    const karmaLife = parseNumeric(payslipData.karmaLife);

    const totalGrossA =
      basic +
      hra +
      specialAllowance +
      statutoryBonus +
      arrearsAmount +
      otAmount +
      extraHolidayPay +
      attendanceIncentive +
      performanceIncentive +
      specialIncentive;
    const grossDeductionB = professionTax + pfAmount + esic + arrearDeduction + karmaLife;
    const netTakeHome = totalGrossA - grossDeductionB;

    return { totalGrossA, grossDeductionB, netTakeHome };
  };

  const numberToWords = (num: number): string => {
    const units = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

    if (num === 0) return "zero";

    const convertLessThanOneThousand = (n: number): string => {
      if (n < 20) return units[n];
      const digit = n % 10;
      if (n < 100) return tens[Math.floor(n / 10)] + (digit ? "-" + units[digit] : "");
      return (
        units[Math.floor(n / 100)] +
        " hundred" +
        (n % 100 ? " and " + convertLessThanOneThousand(n % 100) : "")
      );
    };

    let words = "";
    let chunk = 0;

    chunk = Math.floor(num / 100000);
    if (chunk > 0) {
      words += convertLessThanOneThousand(chunk) + " lakh";
      if (chunk > 1) words += "s";
      num %= 100000;
      if (num > 0) words += " ";
    }

    chunk = Math.floor(num / 1000);
    if (chunk > 0) {
      words += convertLessThanOneThousand(chunk) + " thousand";
      num %= 1000;
      if (num > 0) words += " ";
    }

    if (num > 0) {
      words += convertLessThanOneThousand(num);
    }

    return words + " only";
  };

  const processBatchedExcelFile = async () => {
    if (!file) {
      setStatus({ type: "error", message: "Please select an Excel file first" });
      return;
    }
    if (!selectedMonth) {
      setStatus({ type: "error", message: "Please select a month first" });
      return;
    }
    if (!selectedClient) {
      setStatus({ type: "error", message: "Please select a client first" });
      return;
    }
  
    setIsProcessing(true);
    setStatus({ type: "info", message: "Processing Excel file..." });
  
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
      const processedData = jsonData.map((row: any) => {
        const payslipData = {
          employeeId: row["Emp ID"] || "",
          employeeName: row["Employee Name"] || "",
          mobileNumber: row["Mobile Number"] || "",
          dob: row["DOB"] || "",
          doj: row["DOJ"] || "",
          designation: row["Designation"] || "",
          department: row["Department"] || "",
          bankName: row["Bank Name"] || "",
          bankAccountNo: row["Bank Account No"] || "",
          ifscCode: row["IFSC code"] || "",
          panNo: row["PAN NO"] || "",
          pfNumber: row["PF Number"] || "",
          uanNo: row["UAN No"] || "",
          esicNo: row["ESI No"] || "",
          workingDays: row["Number of days working"] || "",
          extraDays: parseNumeric(row["Extra Days"]),
          otHrs: parseNumeric(row["OT hrs"]),
          arrearsDays: row["Arrears Days"] || "",
          lop: row["LOP"] || "",
          clientId: selectedClient,
          basic: parseNumeric(row["BASIC"]),
          hra: parseNumeric(row["HRA"]),
          specialAllowance: parseNumeric(row["Special Allowance"]),
          statutoryBonus: parseNumeric(row["Statutory Bonus"]),
          arrearsAmount: parseNumeric(row["Arrears amount"]),
          otAmount: parseNumeric(row["OT Amount"]),
          extraHolidayPay: parseNumeric(row["Extra & Holiday pay"]),
          attendanceIncentive: parseNumeric(row["Attendance Incentive"]),
          performanceIncentive: parseNumeric(row["Performance Incentive"]),
          specialIncentive: parseNumeric(row["Special Incentive"]),
          professionTax: parseNumeric(row["Profession Tax"]), // Matches schema
          pfAmount: parseNumeric(row["PF amount"]),
          esic: parseNumeric(row["ESIC"]),
          arrearDeduction: parseNumeric(row["Arrear Deduction"]),
          karmaLife: parseNumeric(row["Karma Life"]),
        };
  
        const calculatedTotals = calculateTotals(payslipData);
        payslipData.totalGrossA = calculatedTotals.totalGrossA;
        payslipData.grossDeductionB = calculatedTotals.grossDeductionB;
        payslipData.netTakeHome = calculatedTotals.netTakeHome;
        payslipData.netPayWords = numberToWords(calculatedTotals.netTakeHome);
  
        return payslipData;
      });
  
      setPreviewData(processedData.slice(0, 10));
      setShowPreview(true);
  
      const [year, month] = selectedMonth.split("-"); // Split YYYY-MM into year and month
      const batchSize = 50;
      let processedCount = 0;
      let successCount = 0;
      let failedCount = 0;
  
      setStatus({
        type: "info",
        message: `Processing ${processedData.length} records in batches of ${batchSize}...`,
      });
  
      for (let i = 0; i < processedData.length; i += batchSize) {
        const batch = processedData.slice(i, i + batchSize);
        setStatus({
          type: "info",
          message: `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
            processedData.length / batchSize
          )}...`,
        });
  
        try {
          const response = await fetch("/api/payslips/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payslips: batch, month, year, clientId: selectedClient }),
          });
          if (!response.ok) throw new Error(`Batch failed: ${response.status}`);
          const result = await response.json();
          if (!result.success) throw new Error(result.error || "Failed to save batch");
          processedCount += result.processedCount || batch.length;
          successCount += result.results.filter((r: any) => r.success).length;
          failedCount += result.results.filter((r: any) => !r.success).length;
        } catch (error) {
          console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
          failedCount += batch.length;
        }
      }
  
      setStatus({
        type: "success",
        message: `Successfully processed ${successCount} of ${processedData.length} records for ${selectedMonth}. ${failedCount} failed.`,
      });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Error processing Excel file",
      });
      setShowPreview(false);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "employees") {
      setEmployeePagination({ ...employeePagination, currentPage: 1 });
      fetchEmployees(1, searchTerm);
    } else if (activeTab === "clients") {
      setClientPagination({ ...clientPagination, currentPage: 1 });
      fetchClients(1, searchTerm);
    }
  };

  const handleMonthFilter = (value: string) => {
    setFilterMonth(value === "all" ? "" : value);
    setPayslipPagination({ ...payslipPagination, currentPage: 1 });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddClient = async () => {
    if (!newClientName.trim()) {
      setStatus({ type: "error", message: "Client name is required" });
      return;
    }
    try {
      setIsAddingClient(true);
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName,
          address: newClientAddress,
          contactPerson: newClientContactPerson,
          email: newClientEmail,
          phone: newClientPhone,
          isDefault: newClientIsDefault,
        }),
      });
      if (!response.ok) throw new Error(`Failed to add client: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to add client");
      setStatus({ type: "success", message: "Client added successfully" });
      setNewClientName("");
      setNewClientAddress("");
      setNewClientContactPerson("");
      setNewClientEmail("");
      setNewClientPhone("");
      setNewClientIsDefault(false);
      fetchClients();
    } catch (error) {
      console.error("Error adding client:", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to add client",
      });
    } finally {
      setIsAddingClient(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === "employee") {
        if (isBulkDelete) {
          for (const employeeId of selectedEmployees) {
            const response = await fetch(`/api/employees/${employeeId}`, { method: "DELETE" });
            if (!response.ok) throw new Error(`Failed to delete employee ${employeeId}`);
          }
          setStatus({
            type: "success",
            message: `${selectedEmployees.length} employees deleted successfully`,
          });
          setSelectedEmployees([]);
        } else if (deleteTarget) {
          const response = await fetch(`/api/employees/${deleteTarget}`, { method: "DELETE" });
          if (!response.ok) throw new Error(`Failed to delete employee ${deleteTarget}`);
          setStatus({ type: "success", message: "Employee deleted successfully" });
        }
        fetchEmployees(employeePagination.currentPage, searchTerm);
      } else if (deleteType === "payslip") {
        if (isBulkDelete) {
          const employeeIds = selectedPayslips.map((p) => p.employeeId);
          const months = selectedPayslips.map((p) => p.month);
          const years = selectedPayslips.map((p) => p.year);
          const response = await fetch(`/api/payslips/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeIds, months, years }),
          });
          if (!response.ok) throw new Error(`Failed to delete payslips: ${response.status}`);
          const result = await response.json();
          if (!result.success) throw new Error(result.error || "Failed to delete payslips");
          setStatus({
            type: "success",
            message: `${result.deletedCount} payslips deleted successfully`,
          });
          setSelectedPayslips([]);
        } else if (deleteTarget) {
          const [employeeId, month, year] = deleteTarget.split(":");
          const response = await fetch(`/api/payslips/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeIds: [employeeId], months: [month], years: [year] }),
          });
          if (!response.ok) throw new Error(`Failed to delete payslip: ${response.status}`);
          const result = await response.json();
          if (!result.success) throw new Error(result.error || "Failed to delete payslip");
          setStatus({ type: "success", message: "Payslip deleted successfully" });
        }
        fetchPayslips(payslipPagination.currentPage, filterMonth);
      } else if (deleteType === "client") {
        if (deleteTarget) {
          const response = await fetch(`/api/clients/${deleteTarget}`, { method: "DELETE" });
          if (!response.ok) throw new Error(`Failed to delete client: ${response.status}`);
          const result = await response.json();
          if (!result.success) throw new Error(result.error || "Failed to delete client");
          setStatus({ type: "success", message: "Client deleted successfully" });
          fetchClients(clientPagination.currentPage, searchTerm);
        }
      }
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : `Failed to delete ${deleteType}`,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      setIsBulkDelete(false);
    }
  };

  const handleSetDefaultClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!response.ok) throw new Error(`Failed to set default client: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to set default client");
      setStatus({ type: "success", message: "Default client updated successfully" });
      fetchClients(clientPagination.currentPage, searchTerm);
    } catch (error) {
      console.error("Error setting default client:", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to set default client",
      });
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId],
    );
  };

  const togglePayslipSelection = (payslip: { employeeId: string; month: string; year: string }) => {
    setSelectedPayslips((prev) => {
      const exists = prev.some(
        (p) => p.employeeId === payslip.employeeId && p.month === payslip.month && p.year === payslip.year,
      );
      return exists
        ? prev.filter(
            (p) =>
              !(
                p.employeeId === payslip.employeeId &&
                p.month === payslip.month &&
                p.year === payslip.year
              ),
          )
        : [...prev, payslip];
    });
  };

  const openEmployeeEditDialog = (employeeId: string) => {
    setEditEmployeeId(employeeId);
    setIsEditDialogOpen(true);
  };

  const handleEmployeeEditSave = () => {
    fetchEmployees(employeePagination.currentPage, searchTerm);
  };

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
                  onClick={processBatchedExcelFile}
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
                                <TableCell className="text-xs">{employee.name || employee.employeeName}</TableCell>
                                <TableCell className="text-xs">{employee.mobileNumber}</TableCell>
                                <TableCell className="text-xs">{employee.department}</TableCell>
                                <TableCell className="text-xs">{employee.designation}</TableCell>
                                <TableCell className="text-xs">{formatDate(employee.updatedAt)}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-blue-500"
                                      onClick={() => openEmployeeEditDialog(employee.employeeId)}
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">View/Edit</span>
                                    </Button>
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
                                  </div>
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
                            <TableHead className="text-right text-xs">Net Pay</TableHead>
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
                                <TableCell className="text-xs text-right">₹{payslip.netTakeHome}</TableCell>
                                <TableCell className="text-xs">{formatDate(payslip.createdAt)}</TableCell>
                                <TableCell className="text-xs">{formatDate(payslip.updatedAt)}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-blue-500"
                                      onClick={() => openEmployeeEditDialog(payslip.employeeId)}
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">View/Edit</span>
                                    </Button>
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
                                  </div>
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

      {/* Employee Edit Dialog */}
      <EmployeeEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        employeeId={editEmployeeId}
        onSave={handleEmployeeEditSave}
      />
    </div>
  )
}

