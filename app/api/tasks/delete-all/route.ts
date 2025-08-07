import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession, verifyDeletePin } from "@/lib/auth"

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 })
    }

    const isPinValid = await verifyDeletePin(pin)
    if (!isPinValid) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 403 })
    }

    // Delete all tasks
    await sql`DELETE FROM tasks`

    // Reset the sequence to start from 1 again
    await sql`ALTER SEQUENCE tasks_id_seq RESTART WITH 1`

    return NextResponse.json({
      success: true,
      message: "All tasks deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting all tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
