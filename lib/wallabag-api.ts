"use client"

import { getToken, getCredentials } from "./token-storage"
import type { Article } from "@/types/article"
import Cookies from "js-cookie"

// Updated API endpoints based on Wallabag API documentation
const API_ENDPOINTS = {
  ENTRIES: "/api/entries.json",
  ENTRY: "/api/entries/{entry}.json",
  ANNOTATIONS: "/api/annotations",
}

// Ensure URL has trailing slash if needed
function ensureValidUrl(url: string): string {
  // Remove trailing slash if present
  return url.endsWith("/") ? url.slice(0, -1) : url
}

// Get the base URL from localStorage or cookies
function getBaseUrl(): string {
  try {
    // Try to get from credentials first
    const credentials = getCredentials()
    if (credentials.apiUrl) {
      console.log("Using URL from credentials:", credentials.apiUrl)
      return ensureValidUrl(credentials.apiUrl)
    }

    // Try to get from localStorage as fallback
    const storedUrl = localStorage.getItem("wallabag_url")
    if (storedUrl) {
      console.log("Using URL from localStorage:", storedUrl)
      return ensureValidUrl(storedUrl)
    }

    // Try to get from cookies as fallback
    const cookieUrl = Cookies.get("wallabag_url")
    if (cookieUrl) {
      console.log("Using URL from cookies:", cookieUrl)
      return ensureValidUrl(cookieUrl)
    }

    // Fallback to empty string
    console.log("No URL found")
    return ""
  } catch (error) {
    console.error("Error getting base URL:", error)
    return ""
  }
}

// Get the authorization header with the token
function getAuthHeader(): string {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }
    console.log("Token expiry:", new Date(token.expires_at || 0).toISOString())
    return `Bearer ${token.access_token}`
  } catch (error) {
    console.error("Error getting auth header:", error)
    throw new Error("Authentication error")
  }
}

// Make a request through our proxy
async function proxyRequest(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const proxyUrl = "/api/proxy"

    // Extract headers from options
    const headers = options.headers || {}

    // Extract method and body
    const method = options.method || "GET"
    let data = null
    let requestBody = null

    if (options.body) {
      // Handle different content types
      if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
        requestBody = options.body.toString()
      } else if (typeof options.body === "string") {
        try {
          data = JSON.parse(options.body)
        } catch (e) {
          data = options.body
        }
      }
    }

    console.log(`Proxying request to: ${url}`)
    console.log(`Method: ${method}`)

    // Make the proxy request
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        method,
        headers,
        data,
        body: requestBody,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Proxy returned ${response.status}: ${errorText}`)
    }

    const proxyResponse = await response.json()

    // Check if the proxied request was successful
    if (proxyResponse.status >= 400) {
      throw new Error(`API returned ${proxyResponse.status}: ${proxyResponse.statusText}`)
    }

    return proxyResponse.data
  } catch (error) {
    console.error("Proxy request error:", error)
    throw error
  }
}

// Get articles with optional filter
export async function getArticles(filter: "unread" | "archived" | "starred" | "all"): Promise<Article[]> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    const params = new URLSearchParams({
      sort: "created",
      order: "desc",
      page: "1",
      perPage: "30",
    })

    // Apply filter
    if (filter === "unread") {
      params.append("archive", "0")
    } else if (filter === "archived") {
      params.append("archive", "1")
    } else if (filter === "starred") {
      params.append("starred", "1")
    }

    const url = `${baseUrl}${API_ENDPOINTS.ENTRIES}?${params}`

    const headers = {
      Authorization: getAuthHeader(),
    }

    // Use our proxy instead of direct fetch
    const data = await proxyRequest(url, { headers })

    if (!data._embedded || !data._embedded.items) {
      throw new Error("Invalid API response format")
    }

    // Transform API response to our Article type
    return data._embedded.items.map((item: any) => ({
      id: item.id.toString(),
      title: item.title || "Untitled",
      url: item.url || "",
      content: item.content || "",
      preview:
        item.preview ||
        (item.content ? item.content.substring(0, 150).replace(/<[^>]*>/g, "") : "No preview available"),
      domain: item.url ? new URL(item.url).hostname.replace("www.", "") : "unknown",
      created_at: item.created_at || new Date().toISOString(),
      is_archived: item.is_archived === 1,
      is_starred: item.is_starred === 1,
      annotations: item.annotations || [],
    }))
  } catch (error) {
    console.error("Error fetching articles:", error)
    throw new Error(`Failed to fetch articles: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Get a single article by ID
export async function getArticle(id: string): Promise<Article | null> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    // Use the correct URL format with {entry} placeholder replaced
    const url = `${baseUrl}${API_ENDPOINTS.ENTRY.replace("{entry}", id)}`

    console.log(`Fetching article from: ${url}`)

    const headers = {
      Authorization: getAuthHeader(),
    }

    // Use our proxy
    const item = await proxyRequest(url, { headers })

    return {
      id: item.id.toString(),
      title: item.title || "Untitled",
      url: item.url || "",
      content: item.content || "",
      preview:
        item.preview ||
        (item.content ? item.content.substring(0, 150).replace(/<[^>]*>/g, "") : "No preview available"),
      domain: item.url ? new URL(item.url).hostname.replace("www.", "") : "unknown",
      created_at: item.created_at || new Date().toISOString(),
      is_archived: item.is_archived === 1,
      is_starred: item.is_starred === 1,
      annotations: item.annotations || [],
    }
  } catch (error) {
    console.error("Error fetching article:", error)
    throw new Error(`Failed to fetch article: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Add a new article
export async function addArticle(url: string): Promise<void> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    const apiUrl = `${baseUrl}${API_ENDPOINTS.ENTRIES}`

    const headers = {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    }

    // Use our proxy
    await proxyRequest(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ url }),
    })
  } catch (error) {
    console.error("Error adding article:", error)
    throw new Error(`Failed to add article: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Toggle archive status
export async function toggleArchive(id: string, archive: boolean): Promise<void> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    // Use the correct URL format with {entry} placeholder replaced
    const url = `${baseUrl}${API_ENDPOINTS.ENTRY.replace("{entry}", id)}`

    const headers = {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    }

    // Use our proxy
    await proxyRequest(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archive: archive ? 1 : 0 }),
    })
  } catch (error) {
    console.error("Error toggling archive status:", error)
    throw new Error(`Failed to update article: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Toggle star status
export async function toggleStar(id: string, star: boolean): Promise<void> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    // Use the correct URL format with {entry} placeholder replaced
    const url = `${baseUrl}${API_ENDPOINTS.ENTRY.replace("{entry}", id)}`

    const headers = {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    }

    // Use our proxy
    await proxyRequest(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ starred: star ? 1 : 0 }),
    })
  } catch (error) {
    console.error("Error toggling star status:", error)
    throw new Error(`Failed to update article: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Delete an article
export async function deleteArticle(id: string): Promise<void> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    // Use the correct URL format with {entry} placeholder replaced
    const url = `${baseUrl}${API_ENDPOINTS.ENTRY.replace("{entry}", id)}`

    const headers = {
      Authorization: getAuthHeader(),
    }

    // Use our proxy
    await proxyRequest(url, {
      method: "DELETE",
      headers,
    })
  } catch (error) {
    console.error("Error deleting article:", error)
    throw new Error(`Failed to delete article: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Save annotation for highlighted text
export async function saveAnnotation(articleId: string, text: string, annotation: string): Promise<void> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    // Use the correct URL format for annotations based on the API documentation
    // /api/annotations/{entry}.{_format}
    const url = `${baseUrl}/api/annotations/${articleId}.json`

    const headers = {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    }

    // Prepare the annotation data according to the API documentation
    const annotationData = {
      text: annotation,
      quote: text,
      ranges: [
        {
          start: "/div[1]/p[1]",
          startOffset: 0,
          end: "/div[1]/p[1]",
          endOffset: text.length,
        },
      ],
    }

    console.log(`Creating annotation for article ${articleId}:`, annotationData)

    // Use our proxy
    await proxyRequest(url, {
      method: "POST",
      headers,
      body: JSON.stringify(annotationData),
    })
  } catch (error) {
    console.error("Error saving annotation:", error)
    throw new Error(`Failed to save annotation: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Delete an annotation
export async function deleteAnnotation(annotationId: string): Promise<void> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    // Use the correct URL format for deleting annotations based on the API documentation
    // /api/annotations/{annotation}.{_format}
    const url = `${baseUrl}/api/annotations/${annotationId}.json`

    const headers = {
      Authorization: getAuthHeader(),
    }

    console.log(`Deleting annotation ${annotationId}`)

    // Use our proxy
    await proxyRequest(url, {
      method: "DELETE",
      headers,
    })
  } catch (error) {
    console.error("Error deleting annotation:", error)
    throw new Error(`Failed to delete annotation: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Update an annotation
export async function updateAnnotation(annotationId: string, newText: string): Promise<void> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    // Use the correct URL format for updating annotations based on the API documentation
    // /api/annotations/{annotation}.{_format}
    const url = `${baseUrl}/api/annotations/${annotationId}.json`

    const headers = {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    }

    // Prepare the update data
    const updateData = {
      text: newText,
    }

    console.log(`Updating annotation ${annotationId}:`, updateData)

    // Use our proxy
    await proxyRequest(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    })
  } catch (error) {
    console.error("Error updating annotation:", error)
    throw new Error(`Failed to update annotation: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Get annotations for an article
export async function getAnnotations(articleId: string): Promise<any[]> {
  try {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      throw new Error("API URL not configured")
    }

    // Use the correct URL format for getting annotations based on the API documentation
    // /api/annotations/{entry}.{_format}
    const url = `${baseUrl}/api/annotations/${articleId}.json`

    const headers = {
      Authorization: getAuthHeader(),
    }

    console.log(`Fetching annotations for article ${articleId}`)

    // Use our proxy
    const data = await proxyRequest(url, { headers })
    return Array.isArray(data.rows) ? data.rows : []
  } catch (error) {
    console.error("Error fetching annotations:", error)
    throw new Error(`Failed to fetch annotations: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Client-side authentication
export async function authenticateUser(
  username: string,
  password: string,
  apiUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<any> {
  try {
    if (!apiUrl || !clientId || !clientSecret) {
      throw new Error("API URL, Client ID, and Client Secret are required")
    }

    const url = `${ensureValidUrl(apiUrl)}/oauth/v2/token`

    // Prepare the form data
    const params = new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
    })

    // Use our proxy instead of direct fetch
    const response = await proxyRequest(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    return response
  } catch (error) {
    console.error("Authentication error:", error)
    throw error
  }
}
