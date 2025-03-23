import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee, getAllEmployees } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const { employees, total, totalPages } = await getAllEmployees(page, limit, search)

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch employees" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ employeeId: body.employeeId })

    if (existingEmployee) {
      // Update existing employee
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId: body.employeeId },
        { ...body, updatedAt: new Date() },
        { new: true },
      )

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

