import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from '@/contexts/user-context'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'Build better habits, one day at a time',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          {children}
          <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}
