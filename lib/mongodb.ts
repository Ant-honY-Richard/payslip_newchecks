import mongoose from "mongoose"
import { Schema } from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    }

    mongoose.set("strictQuery", true)
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("Connected to MongoDB")
        return mongoose.connection.db
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err)
        throw err
      })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (e) {
    cached.promise = null
    throw e
  }
}

// Client Schema
const clientSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Employee Schema
const employeeSchema = new Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  mobileNumber: { type: String },
  designation: { type: String },
  department: { type: String },
  joiningDate: { 
    type: Date,
    get: (date: Date) => date?.toISOString() // Store as ISO string
  },
  clientId: { type: Schema.Types.ObjectId, ref: "Client" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Payslip Schema
const payslipSchema = new Schema({
  employeeId: { type: String, required: true },
  month: { type: String, required: true }, // Format: YYYY-MM
  year: { type: String, required: true },
  basic: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  conveyanceAllowance: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  otAmount: { type: Number, default: 0 },
  otHrs: { type: Number, default: 0 },
  extraDays: { type: Number, default: 0 },
  extraHolidayPay: { type: Number, default: 0 },
  attendanceIncentive: { type: Number, default: 0 },
  performanceIncentive: { type: Number, default: 0 },
  specialIncentive: { type: Number, default: 0 },
  statutoryBonus: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  incomeTax: { type: Number, default: 0 },
  pfAmount: { type: Number, default: 0 },
  esic: { type: Number, default: 0 },
  karmaLife: { type: Number, default: 0 },
  loanDeduction: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Define models
export const Client = mongoose.models.Client || mongoose.model("Client", clientSchema)
export const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema)
export const Payslip = mongoose.models.Payslip || mongoose.model("Payslip", payslipSchema)

// Helper function to get all employees with pagination
export async function getAllEmployees(page = 1, limit = 10, search = "") {
  try {
    await connectToDatabase()

    const skip = (page - 1) * limit

    // Build query
    const query = search
      ? {
          $or: [
            { employeeId: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
            { department: { $regex: search, $options: "i" } },
          ],
        }
      : {}

    // Get employees with lean() for better performance
    const employees = await Employee.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec()

    // Get total count
    const total = await Employee.countDocuments(query).exec()
    const totalPages = Math.ceil(total / limit)

    return { employees, total, totalPages }
  } catch (error) {
    console.error("Error in getAllEmployees:", error)
    throw error
  }
}

// Helper function to get all payslips with pagination
export async function getAllPayslips(page = 1, limit = 10, filters: any = {}) {
  try {
    await connectToDatabase()

    const skip = (page - 1) * limit

    // Build query
    const query = filters

    // Get payslips with lean() for better performance
    const payslips = await Payslip.find(query)
    .populate("employeeId") // Ensure employee details are fully available
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
  

    // Get total count
    const total = await Payslip.countDocuments(query).exec()
    const totalPages = Math.ceil(total / limit)

    return { payslips, total, totalPages }
  } catch (error) {
    console.error("Error in getAllPayslips:", error)
    throw error
  }
}

// Helper function to get payslips by month with pagination
export async function getPayslipsByMonth(month: string, year: string, page = 1, limit = 10) {
  try {
    await connectToDatabase()

    const skip = (page - 1) * limit

    // Build query
    const query = { month, year }

    // Get payslips with lean() for better performance
    const payslips = await Payslip.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec()

    // Get total count
    const total = await Payslip.countDocuments(query).exec()
    const totalPages = Math.ceil(total / limit)

    return { payslips, total, totalPages }
  } catch (error) {
    console.error("Error in getPayslipsByMonth:", error)
    throw error
  }
}

