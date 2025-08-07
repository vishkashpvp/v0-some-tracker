import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Calculate start and end of the current week (Sunday to Saturday)
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 for Sunday, 1 for Monday, etc.
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek) // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Go forward to Saturday
    endOfWeek.setHours(23, 59, 59, 999)

    let upcomingTasks

    if (session.role === 'admin') {
      // Admin sees all approved upcoming tasks
      upcomingTasks = await sql`
        SELECT id, title, description, status, priority, category, 
               due_date, created_at, 
               updated_at, approval_status, requested_by, approved_by, approved_at,
               is_deleted, deleted_at
        FROM tasks 
        WHERE approval_status = 'approved' 
          AND is_deleted = FALSE
          AND due_date >= ${startOfWeek.toISOString().split('T')[0]}::date
          AND due_date <= ${endOfWeek.toISOString().split('T')[0]}::date
        ORDER BY due_date ASC, priority DESC
      `
    } else {
      // Users see their own approved upcoming tasks and their own pending upcoming tasks
      upcomingTasks = await sql`
        SELECT id, title, description, status, priority, category, 
               due_date, created_at, 
               updated_at, approval_status, requested_by, approved_by, approved_at,
               is_deleted, deleted_at
        FROM tasks 
        WHERE (approval_status = 'approved' AND requested_by = ${session.username})
           OR (approval_status = 'pending' AND requested_by = ${session.username})
          AND is_deleted = FALSE
          AND due_date >= ${startOfWeek.toISOString().split('T')[0]}::date
          AND due_date <= ${endOfWeek.toISOString().split('T')[0]}::date
        ORDER BY due_date ASC, priority DESC
      `
    }

    return NextResponse.json(upcomingTasks)
  } catch (error: any) {
    console.error("Error fetching upcoming tasks:", error)
    if (error.message && error.message.includes('relation "tasks" does not exist')) {
      return NextResponse.json({ error: "Database setup incomplete: 'tasks' table not found. Please run the setup SQL script." }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error fetching upcoming tasks" }, { status: 500 })
  }
}
