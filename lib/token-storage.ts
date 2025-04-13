"use client"

interface TokenData {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string | null
  expires_at?: number
}

interface WallabagCredentials {
  clientId: string
  clientSecret: string
  apiUrl: string
}

const TOKEN_STORAGE_KEY = "wallabag_token"
const CREDENTIALS_STORAGE_KEY = "wallabag_credentials"

export function saveToken(tokenData: TokenData): void {
  try {
    if (!tokenData.access_token) {
      console.error("Cannot save token: access_token is missing")
      return
    }

    // Calculate when the token will expire (default to 2 years if not provided)
    const expiresIn = tokenData.expires_in || 2 * 365 * 24 * 60 * 60 // 2 years in seconds
    const expiresAt = Date.now() + expiresIn * 1000

    // Store the token with expiration time
    const tokenToStore = {
      ...tokenData,
      expires_at: expiresAt,
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenToStore))
  } catch (error) {
    console.error("Error saving token:", error)
  }
}

export function getToken(): TokenData | null {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return null
    }

    const tokenJson = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!tokenJson) return null

    try {
      const token = JSON.parse(tokenJson) as TokenData

      // Check if token is expired
      if (token.expires_at && token.expires_at < Date.now()) {
        // Token is expired, remove it
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        return null
      }

      return token
    } catch (error) {
      console.error("Failed to parse token:", error)
      return null
    }
  } catch (error) {
    console.error("Error getting token:", error)
    return null
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing token:", error)
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

// Credentials management
export function saveCredentials(credentials: WallabagCredentials): void {
  try {
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials))
  } catch (error) {
    console.error("Error saving credentials:", error)
  }
}

export function getCredentials(): WallabagCredentials {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return {
        clientId: "",
        clientSecret: "",
        apiUrl: "",
      }
    }

    const credentialsJson = localStorage.getItem(CREDENTIALS_STORAGE_KEY)
    if (!credentialsJson) {
      return {
        clientId: "",
        clientSecret: "",
        apiUrl: "",
      }
    }

    try {
      return JSON.parse(credentialsJson) as WallabagCredentials
    } catch (error) {
      console.error("Failed to parse credentials:", error)
      return {
        clientId: "",
        clientSecret: "",
        apiUrl: "",
      }
    }
  } catch (error) {
    console.error("Error getting credentials:", error)
    return {
      clientId: "",
      clientSecret: "",
      apiUrl: "",
    }
  }
}

export function clearCredentials(): void {
  try {
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing credentials:", error)
  }
}
