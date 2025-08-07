import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const requests = await sql`
      SELECT dr.*, t.title, t.description
      FROM task_deletion_requests dr
      JOIN tasks t ON dr.task_id = t.id
      WHERE dr.status = 'pending'
      ORDER BY dr.created_at DESC
    `

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching deletion requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId, reason } = await request.json()

    if (session.role === 'admin') {
      // Admin can delete directly
      await sql`DELETE FROM tasks WHERE id = ${taskId}`
      return NextResponse.json({ success: true, message: "Task deleted" })
    } else {
      // Users create deletion request
      const result = await sql`
        INSERT INTO task_deletion_requests (task_id, requested_by, reason)
        VALUES (${taskId}, ${session.username}, ${reason})
        RETURNING *
      `
      return NextResponse.json({ 
        success: true, 
        message: "Deletion request submitted for admin approval",
        request: result[0]
      })
    }
  } catch (error) {
    console.error("Error creating deletion request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
