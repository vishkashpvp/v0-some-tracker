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
      WHERE dr.status = 'pending' AND t.is_deleted = FALSE
      ORDER BY dr.created_at DESC
    `

    return NextResponse.json(requests)
  } catch (error: any) {
    console.error("Error fetching deletion requests:", error)
    if (error.message && (error.message.includes('relation "task_deletion_requests" does not exist') || error.message.includes('relation "tasks" does not exist'))) {
      return NextResponse.json({ error: "Database setup incomplete: 'task_deletion_requests' or 'tasks' table not found. Please run the setup SQL script." }, { status: 500 })
    }
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

    // Fetch the task to check its status
    const task = await sql`
      SELECT status FROM tasks WHERE id = ${taskId}
    `
    if (task.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    if (task[0].status === 'completed') {
      return NextResponse.json({ error: "Completed tasks cannot be requested for deletion." }, { status: 403 });
    }

    if (session.role === 'admin') {
      // Admin can delete directly (soft delete)
      await sql`UPDATE tasks SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ${taskId}`
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
  } catch (error: any) {
    console.error("Error creating deletion request:", error)
    if (error.message && (error.message.includes('relation "task_deletion_requests" does not exist') || error.message.includes('relation "tasks" does not exist'))) {
      return NextResponse.json({ error: "Database setup incomplete: 'task_deletion_requests' or 'tasks' table not found. Please run the setup SQL script." }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
