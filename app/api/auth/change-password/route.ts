import { type NextRequest, NextResponse } from "next/server"
import { getSession, changePassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 })
    }

    const success = await changePassword(session.id, currentPassword, newPassword)

    if (success) {
      return NextResponse.json({ success: true, message: "Password changed successfully" })
    } else {
      return NextResponse.json({ error: "Invalid current password or failed to update" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Change password API error:", error)
    if (error.message && error.message.includes('Database setup incomplete')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
