"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveToken, saveCredentials } from "@/lib/token-storage"
import { authenticateUser } from "@/lib/wallabag-api"
import Cookies from "js-cookie"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    wallabagUrl: "",
    clientId: "",
    clientSecret: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setErrorDetails(null)

    try {
      // Validate required fields
      if (
        !formData.username ||
        !formData.password ||
        !formData.wallabagUrl ||
        !formData.clientId ||
        !formData.clientSecret
      ) {
        throw new Error("All fields are required")
      }

      // Authenticate with Wallabag
      const tokenData = await authenticateUser(
        formData.username,
        formData.password,
        formData.wallabagUrl,
        formData.clientId,
        formData.clientSecret,
      )

      // Save token to local storage
      saveToken({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      })

      // Save credentials to local storage
      saveCredentials({
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        apiUrl: formData.wallabagUrl,
      })

      // Also store the URL in localStorage as a fallback
      localStorage.setItem("wallabag_url", formData.wallabagUrl)

      // Set client-side cookies as a backup
      Cookies.set("wallabag_setup_complete", "true", { expires: 730 }) // 2 years
      Cookies.set("wallabag_url", formData.wallabagUrl, { expires: 730 }) // 2 years

      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      })

      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Login error:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to Wallabag</CardTitle>
          <CardDescription>Enter your credentials to access your Wallabag account</CardDescription>
        </CardHeader>
        {error && (
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{error}</p>
                {errorDetails && errorDetails.error_description && (
                  <p className="text-sm italic">{errorDetails.error_description}</p>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallabagUrl">Wallabag URL</Label>
              <Input
                id="wallabagUrl"
                name="wallabagUrl"
                placeholder="https://your-wallabag-instance.com"
                value={formData.wallabagUrl}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                name="clientId"
                placeholder="Your Wallabag client ID"
                value={formData.clientId}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                name="clientSecret"
                placeholder="Your Wallabag client secret"
                value={formData.clientSecret}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={formData.username} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                You need to create a client in your Wallabag settings to get the client ID and client secret.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
