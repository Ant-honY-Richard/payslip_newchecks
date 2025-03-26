import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Payslip, getAllPayslips, getPayslipsByMonth } from "@/lib/mongodb"

export const maxDuration = 9 // Set max duration to 9 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const employeeId = searchParams.get("employeeId")

    // Use a smaller limit to ensure we don't timeout
    const actualLimit = Math.min(limit, 20)

    let result

    if (month && year) {
      result = await getPayslipsByMonth(month, year, page, actualLimit)
    } else if (employeeId) {
      const filters = { employeeId }
      result = await getAllPayslips(page, actualLimit, filters)
    } else {
      result = await getAllPayslips(page, actualLimit)
    }

    return NextResponse.json({
      success: true,
      data: result.payslips,
      pagination: {
        total: result.total,
        totalPages: result.totalPages,
        currentPage: page,
        limit: actualLimit,
      },
    })
  } catch (error) {
    console.error("Error fetching payslips:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch payslips: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Extract month and year from the month string (format: YYYY-MM)
    const [year, month] = body.monthYear.split("-")

    // Check if payslip already exists for this employee and month
    const existingPayslip = await Payslip.findOne({
      employeeId: body.employeeId,
      month,
      year,
    }).lean()

    if (existingPayslip) {
      // Update existing payslip
      const updatedPayslip = await Payslip.findOneAndUpdate(
        {
          employeeId: body.employeeId,
          month,
          year,
        },
        {
          ...body,
          month,
          year,
          updatedAt: new Date(),
        },
        { new: true },
      ).lean()

      return NextResponse.json({
        success: true,
        data: updatedPayslip,
        message: "Payslip updated successfully",
      })
    } else {
      // Create new payslip
      const newPayslip = new Payslip({
        ...body,
        month,
        year,
      })
      await newPayslip.save()

      return NextResponse.json({
        success: true,
        data: newPayslip,
        message: "Payslip created successfully",
      })
    }
  } catch (error) {
    console.error("Error creating/updating payslip:", error)
    return NextResponse.json({ success: false, error: "Failed to create/update payslip" }, { status: 500 })
  }
}

