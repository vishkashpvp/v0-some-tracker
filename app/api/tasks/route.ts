import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let tasks
    if (session.role === 'admin') {
      // Admin sees only approved and non-deleted tasks in main list
      tasks = await sql`
        SELECT id, title, description, status, priority, category, 
               due_date, created_at, 
               updated_at, approval_status, requested_by, approved_by, approved_at,
               is_deleted, deleted_at
        FROM tasks 
        WHERE approval_status = 'approved' AND is_deleted = FALSE
        ORDER BY created_at DESC
      `
    } else {
      // Users see approved and non-deleted tasks, and their own pending tasks
      tasks = await sql`
        SELECT id, title, description, status, priority, category, 
               due_date, created_at, 
               updated_at, approval_status, requested_by, approved_by, approved_at,
               is_deleted, deleted_at
        FROM tasks 
        WHERE (approval_status = 'approved' AND is_deleted = FALSE)
           OR (approval_status = 'pending' AND requested_by = ${session.username} AND is_deleted = FALSE)
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, priority, category, dueDate } = await request.json() // Removed estimatedHours

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json({ error: "Title and category are required" }, { status: 400 })
    }

    // Determine approval status based on user role
    const approvalStatus = session.role === 'admin' ? 'approved' : 'pending'
    const approvedBy = session.role === 'admin' ? session.username : null
    const approvedAt = session.role === 'admin' ? new Date().toISOString() : null

    const result = await sql`
      INSERT INTO tasks (
        title, description, priority, category, 
        due_date, approval_status, requested_by,
        approved_by, approved_at, status, is_deleted
      )
      VALUES (
        ${title}, ${description}, ${priority}, ${category}, 
        ${dueDate || null}, ${approvalStatus}, ${session.username},
        ${approvedBy}, ${approvedAt}, 'todo', FALSE
      )
      RETURNING id, title, description, status, priority, category, 
           due_date, created_at, 
           updated_at, approval_status, requested_by, approved_by, approved_at,
           is_deleted, deleted_at
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
