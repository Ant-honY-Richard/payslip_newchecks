import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PayslipForm from "@/components/payslip-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Payslip Portal</CardTitle>
            <CardDescription className="text-center">Enter your details to retrieve your payslip</CardDescription>
          </CardHeader>
          <CardContent>
            <PayslipForm />
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Newchecks Solutions Private Limited</p>
          <p className="mt-1">#428, 2nd floor 8th block Koramangala</p>
          <p className="mt-1">Bangalore, Karnataka- 560095</p>
        </div>
      </div>
    </div>
  )
}

