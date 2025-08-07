import { type NextRequest, NextResponse } from "next/server"
import { verifyCredentials, createSession, getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const currentSession = await getSession()
    if (!currentSession || currentSession.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required to switch users" }, { status: 403 })
    }

    const { username } = await request.json()
    console.log("Switch user attempt to username:", username)

    if (!username) {
      return NextResponse.json({ error: "Target username is required" }, { status: 400 })
    }

    // For simplicity, we'll use a dummy password for switching.
    // In a real app, you'd fetch the user's actual (hashed) password or use a more secure method.
    // For this demo, we'll assume 'p@$$woRRR9' is a universal dummy password for existing users.
    // A more robust solution would involve fetching the user's actual hashed password from the DB
    // and comparing it, or having a dedicated admin-only switch mechanism.
    const user = await verifyCredentials(username, 'p@$$woRRR9'); // Using dummy password for demo

    if (!user) {
      console.log("Invalid target username for switch")
      return NextResponse.json({ error: "Target user not found or invalid credentials" }, { status: 404 })
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
