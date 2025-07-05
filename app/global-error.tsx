'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">the 1% rule</h1>
            <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
            <p className="text-muted-foreground">
              {error.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={reset}>Try again</Button>
          </div>
        </div>
      </body>
    </html>
  )
} 