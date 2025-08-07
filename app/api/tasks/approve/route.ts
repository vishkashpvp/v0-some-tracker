import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    console.log("API: /api/tasks/approve - Session:", session ? { username: session.username, role: session.role } : "No session")

    if (!session || session.role !== 'admin') {
      console.log("API: /api/tasks/approve - Admin access required, session role:", session?.role)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { taskId, action } = await request.json()
    console.log(`API: /api/tasks/approve - Received request for Task ID: ${taskId}, Action: ${action}`)

    if (action === 'approve') {
      const result = await sql`
        UPDATE tasks 
        SET approval_status = 'approved',
            approved_by = ${session.username},
            approved_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
        RETURNING *
      `
      console.log("API: /api/tasks/approve - Task approved successfully:", result[0])
      return NextResponse.json(result[0])
    } else if (action === 'reject') {
      // Soft delete the task when rejected
      const result = await sql`
        UPDATE tasks
        SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
        RETURNING *
      `
      console.log("API: /api/tasks/approve - Task rejected (soft deleted) successfully:", result[0])
      return NextResponse.json(result[0])
    }

    console.log("API: /api/tasks/approve - Invalid action:", action)
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("API: /api/tasks/approve - Error processing task approval:", error)
    if (error.message && error.message.includes('relation "tasks" does not exist')) {
      return NextResponse.json({ error: "Database setup incomplete: 'tasks' table not found. Please run the setup SQL script." }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
