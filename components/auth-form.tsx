"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Check, X, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface PasswordRequirement {
  id: string
  label: string
  test: (password: string) => boolean
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least one uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "At least one number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "At least one special character",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
]

type AuthMode = "signin" | "signup" | "forgot-password"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<AuthMode>("signin")

  const supabase = createClient()

  const validatePassword = (password: string) => {
    return PASSWORD_REQUIREMENTS.every((req) => req.test(password))
  }

  const getPasswordStrength = (password: string) => {
    return PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length
  }

  const isPasswordValid = validatePassword(password)
  const passwordStrength = getPasswordStrength(password)
  const passwordsMatch = password === confirmPassword
  const canSubmit = email && (mode === "forgot-password" || (password && (mode === "signin" || (isPasswordValid && passwordsMatch))))

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === "signup") {
        if (!isPasswordValid) {
          toast.error("Please meet all password requirements")
          return
        }
        if (!passwordsMatch) {
          toast.error("Passwords do not match")
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        toast.success("Check your email for the confirmation link!")
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        toast.success("Signed in successfully!")
      } else if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        })
        if (error) throw error
        toast.success("Password reset link sent to your email!")
        setMode("signin")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setMode(mode === "signin" ? "signup" : "signin")
  }

  const goToForgotPassword = () => {
    setMode("forgot-password")
    setPassword("")
    setConfirmPassword("")
  }

  const goBackToSignin = () => {
    setMode("signin")
    setPassword("")
    setConfirmPassword("")
  }

  const getTitle = () => {
    switch (mode) {
      case "signup":
        return "Create your account"
      case "forgot-password":
        return "Reset your password"
      default:
        return "Sign in to your account"
    }
  }

  const getDescription = () => {
    switch (mode) {
      case "signup":
        return "Create your account to start tracking habits"
      case "forgot-password":
        return "Enter your email to receive a password reset link"
      default:
        return "Welcome back! Sign in to continue"
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center relative">
          <div className="absolute right-4 top-4">
            <ThemeToggle />
          </div>
          {mode === "forgot-password" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToSignin}
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <CardTitle className="text-2xl">Habit Tracker</CardTitle>
          <CardDescription>{getTitle()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {mode !== "forgot-password" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {mode === "signup" && password && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Password strength: {passwordStrength}/{PASSWORD_REQUIREMENTS.length}
                    </div>
                    <div className="space-y-1">
                      {PASSWORD_REQUIREMENTS.map((requirement) => {
                        const isMet = requirement.test(password)
                        return (
                          <div key={requirement.id} className="flex items-center gap-2 text-xs">
                            {isMet ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <X className="h-3 w-3 text-red-500" />
                            )}
                            <span className={isMet ? "text-green-600" : "text-red-600"}>
                              {requirement.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    {passwordsMatch ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span className={passwordsMatch ? "text-green-600" : "text-red-600"}>
                      Passwords {passwordsMatch ? "match" : "do not match"}
                    </span>
                  </div>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full hover:scale-105 transition-transform duration-200" 
              disabled={isLoading || !canSubmit}
            >
              {isLoading ? "Loading..." : 
                mode === "signup" ? "Sign Up" : 
                mode === "forgot-password" ? "Send Reset Link" : 
                "Sign In"}
            </Button>
          </form>

          {mode === "signin" && (
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={goToForgotPassword} 
                className="text-sm hover:scale-105 transition-transform duration-200"
              >
                Forgot your password?
              </Button>
            </div>
          )}

          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={resetForm} 
              className="text-sm hover:scale-105 transition-transform duration-200"
            >
              {mode === "signup" ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 