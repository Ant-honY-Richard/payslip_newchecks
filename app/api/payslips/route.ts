import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Payslip, getAllPayslips, getPayslipsByMonth } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const employeeId = searchParams.get("employeeId")

    let result

    if (month && year) {
      result = await getPayslipsByMonth(month, year, page, limit)
    } else if (employeeId) {
      const filters = { employeeId }
      result = await getAllPayslips(page, limit, filters)
    } else {
      result = await getAllPayslips(page, limit)
    }

    return NextResponse.json({
      success: true,
      data: result.payslips,
      pagination: {
        total: result.total,
        totalPages: result.totalPages,
        currentPage: page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching payslips:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch payslips" }, { status: 500 })
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
    })

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
      )

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

