import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of paths that don't require authentication
const publicPaths = ["/login", "/api/check-config"]

export function middleware(request: NextRequest) {
  try {
    // Check if the path is public
    const isPublicPath = publicPaths.some(
      (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
    )

    // Skip middleware for public paths, API routes, and static files
    if (
      isPublicPath ||
      request.nextUrl.pathname.startsWith("/api") ||
      request.nextUrl.pathname.startsWith("/_next") ||
      request.nextUrl.pathname.includes(".")
    ) {
      return NextResponse.next()
    }

    // Check if the user has set up their API credentials
    const hasSetupComplete = request.cookies.has("wallabag_setup_complete")

    if (!hasSetupComplete) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to proceed
    // The application will handle authentication checks on the client side
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
