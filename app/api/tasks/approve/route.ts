import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { taskId, action } = await request.json() // action: 'approve' or 'reject'

    if (action === 'approve') {
      const result = await sql`
        UPDATE tasks 
        SET approval_status = 'approved',
            approved_by = ${session.username},
            approved_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
        RETURNING *
      `
      return NextResponse.json(result[0])
    } else if (action === 'reject') {
      const result = await sql`
        UPDATE tasks
        SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
        RETURNING *
      `
      return NextResponse.json(result[0])
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing task approval:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
