import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()
    const taskId = Number.parseInt(params.id)

    // Fetch the current task to check its status and updated_at timestamp
    const currentTask = await sql`
      SELECT status, updated_at FROM tasks WHERE id = ${taskId}
    `

    if (currentTask.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const taskStatus = currentTask[0].status;
    const taskUpdatedAt = new Date(currentTask[0].updated_at);
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

    // If task is completed and more than 15 minutes have passed since last update, prevent modification
    if (taskStatus === 'completed' && (new Date().getTime() - taskUpdatedAt.getTime()) > fifteenMinutes) {
      return NextResponse.json({ error: "Completed tasks cannot be modified after 15 minutes." }, { status: 403 });
    }

    const result = await sql`
      UPDATE tasks 
      SET status = ${status}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
      RETURNING id, title, description, status, priority, category, 
               due_date, created_at, 
               updated_at, approval_status, requested_by, approved_by, approved_at,
               is_deleted, deleted_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("Error updating task:", error)
    if (error.message && error.message.includes('relation "tasks" does not exist')) {
      return NextResponse.json({ error: "Database setup incomplete: 'tasks' table not found. Please run the setup SQL script." }, { status: 500 })
    }
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

    // Fetch the current task to check its status
    const currentTask = await sql`
      SELECT status FROM tasks WHERE id = ${taskId}
    `
    if (currentTask.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    if (currentTask[0].status === 'completed') {
      return NextResponse.json({ error: "Completed tasks cannot be deleted." }, { status: 403 });
    }

    // Perform soft delete
    const result = await sql`
      UPDATE tasks
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting task:", error)
    if (error.message && error.message.includes('relation "tasks" does not exist')) {
      return NextResponse.json({ error: "Database setup incomplete: 'tasks' table not found. Please run the setup SQL script." }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
