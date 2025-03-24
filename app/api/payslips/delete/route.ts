import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Payslip } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { employeeIds, months, years } = body

    if (!employeeIds && !months && !years) {
      return NextResponse.json({ success: false, error: "At least one filter criteria is required" }, { status: 400 })
    }

    // Build the filter
    const filter: any = {}

    if (employeeIds && employeeIds.length > 0) {
      filter.employeeId = { $in: employeeIds }
    }

    if (months && months.length > 0) {
      filter.month = { $in: months }
    }

    if (years && years.length > 0) {
      filter.year = { $in: years }
    }

    // Delete the payslips
    const result = await Payslip.deleteMany(filter)

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} payslips deleted successfully`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error("Error deleting payslips:", error)
    return NextResponse.json({ success: false, error: "Failed to delete payslips" }, { status: 500 })
  }
}

