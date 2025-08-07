import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const requestId = Number.parseInt(params.id)
    const { action } = await request.json() // 'approve' or 'reject'

    // Get the task_id from the request
    const requestData = await sql`
      SELECT task_id FROM task_deletion_requests WHERE id = ${requestId}
    `
    
    if (requestData.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const taskId = requestData[0].task_id

    // Fetch the current task to check its status and updated_at timestamp
    const currentTask = await sql`
      SELECT status, updated_at FROM tasks WHERE id = ${taskId}
    `
    if (currentTask.length === 0) {
      return NextResponse.json({ error: "Task associated with request not found" }, { status: 404 })
    }

    const taskStatus = currentTask[0].status;
    const taskUpdatedAt = new Date(currentTask[0].updated_at);
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

    if (action === 'approve') {
      // If task is completed and more than 15 minutes have passed since last update, prevent deletion
      if (taskStatus === 'completed' && (new Date().getTime() - taskUpdatedAt.getTime()) > fifteenMinutes) {
        return NextResponse.json({ error: "Cannot approve deletion for a locked completed task." }, { status: 403 });
      }

      // Soft delete the task and update the request
      await sql`UPDATE tasks SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ${taskId}`
      
      await sql`
        UPDATE task_deletion_requests 
        SET status = 'approved', approved_by = ${session.username}
        WHERE id = ${requestId}
      `

      return NextResponse.json({ success: true, message: "Task soft deleted" })
    } else if (action === 'reject') {
      await sql`
        UPDATE task_deletion_requests 
        SET status = 'rejected', approved_by = ${session.username}
        WHERE id = ${requestId}
      `
      return NextResponse.json({ success: true, message: "Deletion request rejected" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error processing deletion request:", error)
    if (error.message && (error.message.includes('relation "task_deletion_requests" does not exist') || error.message.includes('relation "tasks" does not exist'))) {
      return NextResponse.json({ error: "Database setup incomplete: 'task_deletion_requests' or 'tasks' table not found. Please run the setup SQL script." }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
