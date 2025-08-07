import { type NextRequest, NextResponse } from "next/server"
import { verifyCredentials, createSession, getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const currentSession = await getSession()
    if (!currentSession || currentSession.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required to switch users" }, { status: 403 })
    }

    const { username, password } = await request.json() // Now receiving password
    console.log("Switch user attempt to username:", username)

    if (!username || !password) { // Require password
      return NextResponse.json({ error: "Target username and password are required" }, { status: 400 })
    }

    const user = await verifyCredentials(username, password); // Pass the provided password

    if (!user) {
      console.log("Invalid target username or password for switch")
      return NextResponse.json({ error: "Invalid target username or password" }, { status: 401 }) // Changed status to 401 for invalid credentials
    }

    await createSession(user)
    console.log("Session switched successfully to:", user.username)

    return NextResponse.json({ 
      success: true, 
      user: { username: user.username, role: user.role },
      redirect: "/"
    })
  } catch (error: any) {
    console.error("Switch user API error:", error)
    if (error.message && error.message.includes('Database setup incomplete')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
