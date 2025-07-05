import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AuthCodeError() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-600">the 1% rule</CardTitle>
          <CardDescription>
            There was an error processing your authentication request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            The authentication link may have expired or is invalid. Please try signing in again or request a new password reset link.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/">Go to Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 