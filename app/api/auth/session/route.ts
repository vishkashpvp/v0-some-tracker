import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    return NextResponse.json({ user: session })
  } catch (error: any) {
    console.error("Session API error:", error)
    if (error.message && error.message.includes('Database setup incomplete')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
