import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { url, method, headers, data, body: requestBody } = body

    // Validate required fields
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log(`Proxying request to: ${url}`)
    console.log(`Method: ${method || "GET"}`)

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: headers || {},
      cache: "no-store",
    }

    // Add body for non-GET requests
    if (method !== "GET") {
      // Handle different content types
      if (headers && headers["Content-Type"] === "application/x-www-form-urlencoded") {
        fetchOptions.body = requestBody
      } else if (data) {
        fetchOptions.body = JSON.stringify(data)
      }
    }

    // Make the request
    const response = await fetch(url, fetchOptions)

    // Get response data
    const responseData = await response.text()
    console.log(`Response status: ${response.status}`)

    // Try to parse as JSON if possible
    let parsedData
    try {
      parsedData = JSON.parse(responseData)
      console.log("Response parsed as JSON successfully")
    } catch (e) {
      console.log("Response is not valid JSON, returning as text")
      parsedData = responseData
    }

    // Return the response
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: parsedData,
    })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
