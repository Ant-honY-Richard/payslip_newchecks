import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, Client } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid client ID" }, { status: 400 })
    }

    // Check if this is the default client
    const client = await Client.findById(id)
    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    // Delete the client
    await Client.findByIdAndDelete(id)

    // If this was the default client, set a new default if any clients remain
    if (client.isDefault) {
      const remainingClient = await Client.findOne()
      if (remainingClient) {
        remainingClient.isDefault = true
        await remainingClient.save()
      }
    }

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ success: false, error: "Failed to delete client" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const { id } = params
    const body = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid client ID" }, { status: 400 })
    }

    // If this client is being set as default, unset any existing default
    if (body.isDefault) {
      await Client.updateMany({}, { $set: { isDefault: false } })
    }

    // Update the client
    const updatedClient = await Client.findByIdAndUpdate(id, { ...body, updatedAt: new Date() }, { new: true })

    if (!updatedClient) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: "Client updated successfully",
    })
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ success: false, error: "Failed to update client" }, { status: 500 })
  }
}

