import { type NextRequest, NextResponse } from "next/server"
import { verifyCredentials, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    console.log("Login attempt for username:", username)

    if (!username || !password) {
      console.log("Missing username or password")
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const user = await verifyCredentials(username, password)
    console.log("Credential verification result:", user ? "success" : "failed")

    if (!user) {
      console.log("Invalid credentials provided")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    await createSession(user)
    console.log("Session created successfully")

    return NextResponse.json({ 
      success: true, 
      user: { username: user.username, role: user.role },
      redirect: "/"
    })
  } catch (error: any) {
    console.error("Login API error:", error)
    if (error.message && error.message.includes('Database setup incomplete')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
