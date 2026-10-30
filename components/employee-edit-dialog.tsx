"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, FileEdit } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface EmployeeEditDialogProps {
  isOpen: boolean
  onClose: () => void
  employeeId: string
  onSave: () => void
}

export default function EmployeeEditDialog({ isOpen, onClose, employeeId, onSave }: EmployeeEditDialogProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [employee, setEmployee] = useState<any>(null)
  const [payslips, setPayslips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)

  // Fetch employee data when dialog opens
  useEffect(() => {
    if (isOpen && employeeId) {
      fetchEmployeeData()
    }
  }, [isOpen, employeeId])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch employee details
      const response = await fetch(`/api/employees/${employeeId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch employee data")
      }
      const data = await response.json()

      if (data.success) {
        setEmployee(data.data)

        // Fetch employee payslips
        const payslipsResponse = await fetch(`/api/payslips?employeeId=${employeeId}`)
        if (payslipsResponse.ok) {
          const payslipsData = await payslipsResponse.json()
          if (payslipsData.success) {
            setPayslips(payslipsData.data || [])
          }
        }
      } else {
        throw new Error(data.error || "Failed to fetch employee data")
      }
    } catch (error) {
      console.error("Error fetching employee data:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch employee data",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeChange = (field: string, value: string) => {
    setEmployee((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePayslipChange = (field: string, value: string) => {
    setSelectedPayslip((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const saveEmployee = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employee),
      })

      if (!response.ok) {
        throw new Error("Failed to save employee data")
      }

      const data = await response.json()

      if (data.success) {
        setSuccess("Employee data saved successfully")
        toast({
          title: "Success",
          description: "Employee data saved successfully",
          variant: "success",
        })
        onSave()
      } else {
        throw new Error(data.error || "Failed to save employee data")
      }
    } catch (error) {
      console.error("Error saving employee data:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save employee data",
      })
    } finally {
      setSaving(false)
    }
  }

  const savePayslip = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Calculate totals before saving
      const basic = Number.parseFloat(selectedPayslip.basic) || 0
      const hra = Number.parseFloat(selectedPayslip.hra) || 0
      const specialAllowance = Number.parseFloat(selectedPayslip.specialAllowance) || 0
      const statutoryBonus = Number.parseFloat(selectedPayslip.statutoryBonus) || 0
      const arrearsAmount = Number.parseFloat(selectedPayslip.arrearsAmount) || 0
      const otAmount = Number.parseFloat(selectedPayslip.otAmount) || 0
      const extraHolidayPay = Number.parseFloat(selectedPayslip.extraHolidayPay) || 0
      const attendanceIncentive = Number.parseFloat(selectedPayslip.attendanceIncentive) || 0
      const performanceIncentive = Number.parseFloat(selectedPayslip.performanceIncentive) || 0
      const specialIncentive = Number.parseFloat(selectedPayslip.specialIncentive) || 0

      const professionTax = Number.parseFloat(selectedPayslip.professionTax) || 0
      const pfAmount = Number.parseFloat(selectedPayslip.pfAmount) || 0
      const esic = Number.parseFloat(selectedPayslip.esic) || 0
      const arrearDeduction = Number.parseFloat(selectedPayslip.arrearDeduction) || 0
      const karmaLife = Number.parseFloat(selectedPayslip.karmaLife) || 0

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
        specialIncentive

      const grossDeductionB = professionTax + pfAmount + esic + arrearDeduction + karmaLife

      const netTakeHome = totalGrossA - grossDeductionB

      // Format the month-year for the API
      const monthYear = `${selectedPayslip.year}-${selectedPayslip.month}`

      const updatedPayslip = {
        ...selectedPayslip,
        totalGrossA,
        grossDeductionB,
        netTakeHome,
        monthYear,
      }

      const response = await fetch(`/api/payslips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPayslip),
      })

      if (!response.ok) {
        throw new Error("Failed to save payslip data")
      }

      const data = await response.json()

      if (data.success) {
        setSuccess("Payslip data saved successfully")
        toast({
          title: "Success",
          description: "Payslip data saved successfully",
          variant: "success",
        })
        // Refresh payslips
        fetchEmployeeData()
      } else {
        throw new Error(data.error || "Failed to save payslip data")
      }
    } catch (error) {
      console.error("Error saving payslip data:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save payslip data",
      })
    } finally {
      setSaving(false)
    }
  }

  const selectPayslip = (payslip: any) => {
    setSelectedPayslip(payslip)
    setActiveTab("payslip")
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4">Loading employee data...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Employee Details: {employeeId}
          </DialogTitle>
          <DialogDescription>View and edit employee information and payslips</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="text-sm">
              Employee Details
            </TabsTrigger>
            <TabsTrigger value="payslips" className="text-sm">
              Payslips
            </TabsTrigger>
            <TabsTrigger value="payslip" disabled={!selectedPayslip} className="text-sm">
              Edit Payslip
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  value={employee?.employeeName || employee?.name || ""}
                  onChange={(e) => handleEmployeeChange("name", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  value={employee?.mobileNumber || ""}
                  onChange={(e) => handleEmployeeChange("mobileNumber", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={employee?.designation || ""}
                  onChange={(e) => handleEmployeeChange("designation", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={employee?.department || ""}
                  onChange={(e) => handleEmployeeChange("department", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  value={employee?.dob || ""}
                  onChange={(e) => handleEmployeeChange("dob", e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doj">Date of Joining</Label>
                <Input
                  id="doj"
                  value={employee?.doj || ""}
                  onChange={(e) => handleEmployeeChange("doj", e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={employee?.bankName || ""}
                  onChange={(e) => handleEmployeeChange("bankName", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountNo">Bank Account No</Label>
                <Input
                  id="bankAccountNo"
                  value={employee?.bankAccountNo || ""}
                  onChange={(e) => handleEmployeeChange("bankAccountNo", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={employee?.ifscCode || ""}
                  onChange={(e) => handleEmployeeChange("ifscCode", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uanNo">UAN Number</Label>
                <Input
                  id="uanNo"
                  value={employee?.uanNo || ""}
                  onChange={(e) => handleEmployeeChange("uanNo", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="esicNo">ESIC Number</Label>
                <Input
                  id="esicNo"
                  value={employee?.esicNo || ""}
                  onChange={(e) => handleEmployeeChange("esicNo", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pfNumber">PF Number</Label>
                <Input
                  id="pfNumber"
                  value={employee?.pfNumber || ""}
                  onChange={(e) => handleEmployeeChange("pfNumber", e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={saveEmployee}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="payslips" className="mt-4">
            {payslips.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No payslips found for this employee</p>
            ) : (
              <div className="border rounded-md overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="text-left p-2 text-blue-700 font-semibold">Month</th>
                      <th className="text-left p-2 text-blue-700 font-semibold">Year</th>
                      <th className="text-right p-2 text-blue-700 font-semibold">Basic</th>
                      <th className="text-right p-2 text-blue-700 font-semibold">Net Pay</th>
                      <th className="text-center p-2 text-blue-700 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map((payslip, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="p-2">
                          {new Date(0, Number.parseInt(payslip.month) - 1).toLocaleString("default", {
                            month: "long",
                          })}
                        </td>
                        <td className="p-2">{payslip.year}</td>
                        <td className="p-2 text-right">₹{payslip.basic || 0}</td>
                        <td className="p-2 text-right">₹{payslip.netTakeHome || 0}</td>
                        <td className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectPayslip(payslip)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payslip" className="space-y-4 mt-4">
            {selectedPayslip && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Input id="month" value={selectedPayslip.month || ""} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" value={selectedPayslip.year || ""} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingDays">Working Days</Label>
                    <Input
                      id="workingDays"
                      value={selectedPayslip.workingDays || ""}
                      onChange={(e) => handlePayslipChange("workingDays", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                <h3 className="font-medium text-lg mt-4 text-blue-700 border-b pb-1">Earnings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basic">Basic</Label>
                    <Input
                      id="basic"
                      type="number"
                      value={selectedPayslip.basic || ""}
                      onChange={(e) => handlePayslipChange("basic", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hra">HRA</Label>
                    <Input
                      id="hra"
                      type="number"
                      value={selectedPayslip.hra || ""}
                      onChange={(e) => handlePayslipChange("hra", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialAllowance">Special Allowance</Label>
                    <Input
                      id="specialAllowance"
                      type="number"
                      value={selectedPayslip.specialAllowance || ""}
                      onChange={(e) => handlePayslipChange("specialAllowance", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrearsAmount">Arrears Amount</Label>
                    <Input
                      id="arrearsAmount"
                      type="number"
                      value={selectedPayslip.arrearsAmount || ""}
                      onChange={(e) => handlePayslipChange("arrearsAmount", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrearsDays">Arrears Days</Label>
                    <Input
                      id="arrearsDays"
                      value={selectedPayslip.arrearsDays || ""}
                      onChange={(e) => handlePayslipChange("arrearsDays", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otHrs">OT Hours</Label>
                    <Input
                      id="otHrs"
                      type="number"
                      value={selectedPayslip.otHrs || ""}
                      onChange={(e) => handlePayslipChange("otHrs", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otAmount">OT Amount</Label>
                    <Input
                      id="otAmount"
                      type="number"
                      value={selectedPayslip.otAmount || ""}
                      onChange={(e) => handlePayslipChange("otAmount", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extraDays">Extra Days</Label>
                    <Input
                      id="extraDays"
                      type="number"
                      value={selectedPayslip.extraDays || ""}
                      onChange={(e) => handlePayslipChange("extraDays", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extraHolidayPay">Extra Holiday Pay</Label>
                    <Input
                      id="extraHolidayPay"
                      type="number"
                      value={selectedPayslip.extraHolidayPay || ""}
                      onChange={(e) => handlePayslipChange("extraHolidayPay", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendanceIncentive">Attendance Incentive</Label>
                    <Input
                      id="attendanceIncentive"
                      type="number"
                      value={selectedPayslip.attendanceIncentive || ""}
                      onChange={(e) => handlePayslipChange("attendanceIncentive", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="performanceIncentive">Performance Incentive</Label>
                    <Input
                      id="performanceIncentive"
                      type="number"
                      value={selectedPayslip.performanceIncentive || ""}
                      onChange={(e) => handlePayslipChange("performanceIncentive", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialIncentive">Special Incentive</Label>
                    <Input
                      id="specialIncentive"
                      type="number"
                      value={selectedPayslip.specialIncentive || ""}
                      onChange={(e) => handlePayslipChange("specialIncentive", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                <h3 className="font-medium text-lg mt-4 text-blue-700 border-b pb-1">Deductions</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pfAmount">PF Amount</Label>
                    <Input
                      id="pfAmount"
                      type="number"
                      value={selectedPayslip.pfAmount || ""}
                      onChange={(e) => handlePayslipChange("pfAmount", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professionTax">Professional Tax</Label>
                    <Input
                      id="professionTax"
                      type="number"
                      value={selectedPayslip.professionTax || ""}
                      onChange={(e) => handlePayslipChange("professionTax", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="esic">ESIC</Label>
                    <Input
                      id="esic"
                      type="number"
                      value={selectedPayslip.esic || ""}
                      onChange={(e) => handlePayslipChange("esic", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrearDeduction">Arrear Deduction</Label>
                    <Input
                      id="arrearDeduction"
                      type="number"
                      value={selectedPayslip.arrearDeduction || ""}
                      onChange={(e) => handlePayslipChange("arrearDeduction", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="karmaLife">Other Deductions</Label>
                    <Input
                      id="karmaLife"
                      type="number"
                      value={selectedPayslip.karmaLife || ""}
                      onChange={(e) => handlePayslipChange("karmaLife", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="UTRNo">UTR Number</Label>
                    <Input
                      id="UTRNo"
                      value={selectedPayslip.UTRNo || ""}
                      onChange={(e) => handlePayslipChange("UTRNo", e.target.value)}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={savePayslip}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Payslip
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

