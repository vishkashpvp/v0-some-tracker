import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status, actualHours } = await request.json()
    const taskId = Number.parseInt(params.id)

    const result = await sql`
      UPDATE tasks 
      SET status = ${status}, 
          actual_hours = COALESCE(${actualHours}, actual_hours),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
      RETURNING id, title, description, status, priority, category, 
               estimated_hours, actual_hours, due_date, created_at, 
               updated_at, approval_status, requested_by, approved_by, approved_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const taskId = Number.parseInt(params.id)

    const result = await sql`
      DELETE FROM tasks WHERE id = ${taskId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
