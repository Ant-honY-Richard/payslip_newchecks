"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
  employeeId: z.string().min(3, {
    message: "Employee ID must be at least 3 characters.",
  }),
  mobileNumber: z.string().min(10, {
    message: "Mobile number must be at least 10 digits.",
  }),
  month: z.string({
    required_error: "Please select a month.",
  }),
})

export default function PayslipForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
      mobileNumber: "",
      month: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    // Check for admin credentials
    if (values.employeeId === "newchecks" && values.mobileNumber === "8105598343") {
      try {
        // Set a cookie to indicate admin authentication
        document.cookie = "admin_authenticated=true; path=/; max-age=3600; SameSite=Strict"

        // Redirect to admin page
        router.push(`/admin`)
        return
      } catch (error) {
        console.error("Error setting admin cookie:", error)
        setError("Authentication failed. Please try again.")
        setIsLoading(false)
        return
      }
    }

    try {
      // Authenticate employee
      const authResponse = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: values.employeeId,
          mobileNumber: values.mobileNumber,
        }),
      })

      const authData = await authResponse.json()

      if (!authData.success) {
        setError(authData.error || "Authentication failed. Please check your credentials.")
        return
      }

      // Redirect to payslip page
      router.push(`/payslip?id=${values.employeeId}&month=${values.month}`)
    } catch (err) {
      console.error("Authentication error:", err)
      setError("An error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Generate past 12 months excluding current month for employees
  const months = (() => {
    // Create a fixed array of exactly 12 months
    const result = []
    const today = new Date()

    // Start with the previous month
    let currentDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)

    // Generate exactly 12 months
    for (let i = 0; i < 12; i++) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1 // JavaScript months are 0-indexed

      // Create a unique value and id
      const value = `${year}-${String(month).padStart(2, "0")}`
      const id = `month-${i}-${value}` // Combine index and value for absolute uniqueness

      result.push({
        value: value,
        label: currentDate.toLocaleString("default", { month: "long", year: "numeric" }),
        id: id,
      })

      // Move to the previous month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    }

    // Add console log for debugging
    console.log("Generated months:", result)

    return result
  })()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter your employee ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter your mobile number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Month</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.id} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing
            </span>
          ) : (
            <span className="flex items-center">
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          )}
        </Button>
      </form>
    </Form>
  )
}

