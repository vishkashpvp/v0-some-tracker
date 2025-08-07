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

    if (action === 'approve') {
      // Get the task_id from the request
      const requestData = await sql`
        SELECT task_id FROM task_deletion_requests WHERE id = ${requestId}
      `
      
      if (requestData.length === 0) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }

      const taskId = requestData[0].task_id

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
  } catch (error) {
    console.error("Error processing deletion request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
