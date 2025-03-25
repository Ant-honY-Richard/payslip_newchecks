import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee, getAllEmployees } from "@/lib/mongodb"

export const maxDuration = 9 // Set max duration to 9 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    // Use a smaller limit to ensure we don't timeout
    const actualLimit = Math.min(limit, 20)
    const { employees, total, totalPages } = await getAllEmployees(page, actualLimit, search)

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit: actualLimit,
      },
    })
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch employees: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ employeeId: body.employeeId }).lean()

    if (existingEmployee) {
      // Update existing employee
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId: body.employeeId },
        { ...body, updatedAt: new Date() },
        { new: true },
      ).lean()

      return NextResponse.json({
        success: true,
        data: updatedEmployee,
        message: "Employee updated successfully",
      })
    } else {
      // Create new employee
      const newEmployee = new Employee(body)
      await newEmployee.save()

      return NextResponse.json({
        success: true,
        data: newEmployee,
        message: "Employee created successfully",
      })
    }
  } catch (error) {
    console.error("Error creating/updating employee:", error)
    return NextResponse.json({ success: false, error: "Failed to create/update employee" }, { status: 500 })
  }
}

