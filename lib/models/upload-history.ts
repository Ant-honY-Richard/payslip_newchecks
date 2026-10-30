import mongoose, { Schema } from "mongoose"

// Define the interface for upload history
export interface UploadHistory {
  fileName: string
  uploadDate: Date
  uploadedBy: string
  month: string
  year: string
  totalRecords: number
  successCount: number
  failedCount: number
  status: "completed" | "failed" | "processing"
  type: "success" | "error" | "info" | null
  message: string
  failedRecords?: Array<{
    employeeId: string
    reason: string
  }>
}

// Create the schema
const uploadHistorySchema = new Schema<UploadHistory>({
  fileName: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  uploadedBy: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: String, required: true },
  totalRecords: { type: Number, required: true },
  successCount: { type: Number, required: true, default: 0 },
  failedCount: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    required: true,
    enum: ["completed", "failed", "processing"],
    default: "processing",
  },
  type: {
    type: String,
    enum: ["success", "error", "info", null],
    default: null,
  },
  message: { type: String, default: "" },
  failedRecords: [
    {
      employeeId: String,
      reason: String,
    },
  ],
})

// Create and export the model
export const UploadHistoryModel =
  mongoose.models.UploadHistory || mongoose.model<UploadHistory>("UploadHistory", uploadHistorySchema)

