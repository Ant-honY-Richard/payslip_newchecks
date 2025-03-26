import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export const dynamic = "force-dynamic"
export const maxDuration = 9

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const db = await connectToDatabase()

    // Create a default client if none exists
    const clientCount = await db.collection("clients").countDocuments()
    if (clientCount === 0) {
      try {
        const defaultClient = {
          name: "Newchecks Solutions Pvt. Ltd",
          address: "#428, 2nd floor 8th block Koramangala, Bangalore, Karnataka- 560095",
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await db.collection("clients").insertOne(defaultClient)
      } catch (err) {
        console.warn("Failed to create default client:", err)
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build query
    const query = search ? { name: { $regex: search, $options: "i" } } : {}

    // Get clients
    const clients = await db
      .collection("clients")
      .find(query)
      .sort({ isDefault: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count
    const total = await db.collection("clients").countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch clients: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Client name is required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Check if this is the first client, make it default if so
    const clientCount = await db.collection("clients").countDocuments()
    if (clientCount === 0) {
      body.isDefault = true
    }

    // If this client is being set as default, unset any existing default
    if (body.isDefault) {
      await db.collection("clients").updateMany({ isDefault: true }, { $set: { isDefault: false } })
    }

    // Add timestamps
    body.createdAt = new Date()
    body.updatedAt = new Date()

    // Create new client
    const result = await db.collection("clients").insertOne(body)

    if (!result.acknowledged) {
      throw new Error("Failed to insert client into database")
    }

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...body },
      message: "Client created successfully",
    })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create client",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

