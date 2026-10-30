import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if the path starts with /admin
  if (path === "/admin" || path.startsWith("/admin/")) {
    // Check if the user is authenticated as admin
    const adminCookie = request.cookies.get("admin_authenticated")

    // If not authenticated, redirect to the home page
    if (!adminCookie || adminCookie.value !== "true") {
      console.log("Unauthorized access attempt to admin page, redirecting to home")
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run on admin routes
export const config = {
  matcher: ["/admin", "/admin/:path*"],
}

