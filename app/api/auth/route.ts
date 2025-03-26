import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Employee } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { employeeId, mobileNumber } = body

    // Special case for admin
    if (employeeId === "ant05" && mobileNumber === "0000000000") {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        message: "Admin authentication successful",
      })
    }

    // Regular employee authentication
    const employee = await Employee.findOne({ employeeId })

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 })
    }

    if (employee.mobileNumber !== mobileNumber) {
      return NextResponse.json({ success: false, error: "Invalid mobile number" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
      },
      message: "Authentication successful",
    })
  } catch (error) {
    console.error("Authentication error:", error)
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
  }
}

