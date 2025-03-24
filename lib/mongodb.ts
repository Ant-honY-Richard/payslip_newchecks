import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongo:COnipcVRXptSvCXZeCPekoBhuJvHZWYF@maglev.proxy.rlwy.net:11513"

// Global variable to track connection status
let isConnected = false

export async function connectToDatabase() {
  if (isConnected) {
    return
  }

  try {
    const db = await mongoose.connect(MONGODB_URI)
    isConnected = !!db.connections[0].readyState
    console.log("MongoDB connected successfully")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw new Error("Failed to connect to MongoDB")
  }
}

// Employee Schema
const EmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  employeeName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  dob: String,
  doj: String,
  designation: String,
  department: String,
  bankName: String,
  bankAccountNo: String,
  ifscCode: String,
  panNo: String,
  pfNumber: String,
  workingDays: String,
  uanNo: String,
  esicNo: String,
  extraDays: String,
  otHrs: String,
  arrearsDays: String,
  lop: String,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Payslip Schema
const PayslipSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    index: true,
  },
  month: {
    type: String,
    required: true,
    index: true,
  },
  year: {
    type: String,
    required: true,
    index: true,
  },

  // Earnings
  basic: String,
  hra: String,
  specialAllowance: String,
  statutoryBonus: String,
  arrearsAmount: String,
  grossEarningsTotal: String,
  otAmount: String,
  extraHolidayPay: String,
  attendanceIncentive: String,
  performanceIncentive: String,
  specialIncentive: String,

  // Deductions
  professionTax: String,
  pfAmount: String,
  esic: String,
  arrearDeduction: String,
  karmaLife: String,

  // Totals
  totalGrossA: String,
  grossDeductionB: String,
  netTakeHome: String,
  netPayWords: String,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Create a compound unique index on employeeId and month+year
PayslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true })

// Define models
export const Employee = mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema)
export const Payslip = mongoose.models.Payslip || mongoose.model("Payslip", PayslipSchema)

// Helper functions
export async function getEmployeeById(employeeId: string) {
  await connectToDatabase()
  return Employee.findOne({ employeeId })
}

export async function getPayslipByEmployeeAndMonth(employeeId: string, month: string, year: string) {
  await connectToDatabase()
  return Payslip.findOne({ employeeId, month, year })
}

export async function getAllEmployees(page = 1, limit = 10, search = "") {
  await connectToDatabase()

  const query = search
    ? {
        $or: [
          { employeeId: { $regex: search, $options: "i" } },
          { employeeName: { $regex: search, $options: "i" } },
          { mobileNumber: { $regex: search, $options: "i" } },
          { department: { $regex: search, $options: "i" } },
        ],
      }
    : {}

  const total = await Employee.countDocuments(query)
  const employees = await Employee.find(query)
    .sort({ employeeId: 1 })
    .skip((page - 1) * limit)
    .limit(limit)

  return { employees, total, totalPages: Math.ceil(total / limit) }
}

export async function getAllPayslips(page = 1, limit = 10, filters = {}) {
  await connectToDatabase()

  const total = await Payslip.countDocuments(filters)
  const payslips = await Payslip.find(filters)
    .sort({ year: -1, month: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

  return { payslips, total, totalPages: Math.ceil(total / limit) }
}

export async function getPayslipsByMonth(month: string, year: string, page = 1, limit = 10) {
  return getAllPayslips(page, limit, { month, year })
}

export async function getPayslipsByEmployee(employeeId: string, page = 1, limit = 10) {
  return getAllPayslips(page, limit, { employeeId })
}

