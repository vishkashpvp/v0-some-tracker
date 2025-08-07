import { NextRequest, NextResponse } from "next/server"
import { decrypt } from '@/lib/auth' // Assuming decrypt is available or session parsing is handled

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the session cookie
  const sessionCookie = request.cookies.get("admin-session")
  let sessionData = null
  if (sessionCookie) {
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (e) {
      console.error("Failed to parse session cookie in middleware:", e)
      // If session is invalid, clear it
      const response = NextResponse.next()
      response.cookies.delete("admin-session")
      return response
    }
  }

  const isAuthenticated = sessionData && new Date(sessionData.expires) > new Date()

  // Redirect to /login if not authenticated and trying to access protected routes
  // The main dashboard '/' and all '/api/tasks' routes are protected.
  if (pathname === "/" || pathname.startsWith("/api/tasks")) {
    if (!isAuthenticated) {
      // For API routes, return 401. For the main page, redirect to login.
      if (pathname.startsWith("/api/tasks")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // If user has session and trying to access login, redirect to dashboard
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
