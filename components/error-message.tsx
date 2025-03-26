import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ErrorMessageProps {
  title?: string
  message: string
  showBackButton?: boolean
}

export default function ErrorMessage({ title = "Error", message, showBackButton = true }: ErrorMessageProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      {showBackButton && (
        <Link href="/">
          <Button variant="outline" className="w-full">
            Go Back
          </Button>
        </Link>
      )}
    </div>
  )
}

