import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee, Payslip } from "@/lib/mongodb"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const { id } = params

    // Delete the employee
    const deletedEmployee = await Employee.findOneAndDelete({ employeeId: id })

    if (!deletedEmployee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 })
    }

    // Delete all associated payslips
    await Payslip.deleteMany({ employeeId: id })

    return NextResponse.json({
      success: true,
      message: "Employee and associated payslips deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json({ success: false, error: "Failed to delete employee" }, { status: 500 })
  }
}

