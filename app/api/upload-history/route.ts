import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { UploadHistoryModel } from "@/lib/models/upload-history"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const query: any = {}

    // Add search filters if provided
    const search = searchParams.get("search")
    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: "i" } },
        { uploadedBy: { $regex: search, $options: "i" } },
        { month: { $regex: search, $options: "i" } },
        { year: { $regex: search, $options: "i" } },
      ]
    }

    // Add date range filter if provided
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    if (startDate && endDate) {
      query.uploadDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    // Pagination
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Get total count for pagination
    const total = await UploadHistoryModel.countDocuments(query)

    // Get records
    const uploadHistory = await UploadHistoryModel.find(query).sort({ uploadDate: -1 }).skip(skip).limit(limit)

    return NextResponse.json({
      success: true,
      data: uploadHistory,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching upload history:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch upload history" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const data = await request.json()

    const newUploadHistory = new UploadHistoryModel({
      fileName: data.fileName,
      uploadedBy: data.uploadedBy,
      month: data.month,
      year: data.year,
      totalRecords: data.totalRecords,
      successCount: data.successCount || 0,
      failedCount: data.failedCount || 0,
      status: data.status || "processing",
      type: data.type || null,
      message: data.message || "",
      failedRecords: data.failedRecords || [],
    })

    await newUploadHistory.save()

    return NextResponse.json({
      success: true,
      data: newUploadHistory,
    })
  } catch (error) {
    console.error("Error creating upload history:", error)
    return NextResponse.json({ success: false, error: "Failed to create upload history" }, { status: 500 })
  }
}

