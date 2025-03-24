import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Client, getAllClients } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const { clients, total, totalPages } = await getAllClients(page, limit, search)

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
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Check if this is the first client, make it default if so
    const clientCount = await Client.countDocuments()
    if (clientCount === 0) {
      body.isDefault = true
    }

    // If this client is being set as default, unset any existing default
    if (body.isDefault) {
      await Client.updateMany({}, { $set: { isDefault: false } })
    }

    // Create new client
    const newClient = new Client(body)
    await newClient.save()

    return NextResponse.json({
      success: true,
      data: newClient,
      message: "Client created successfully",
    })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 })
  }
}

