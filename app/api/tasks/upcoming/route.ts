import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { priorityConfig, statusConfig } from "@/lib/constants" // Import constants
import { type TaskStatus, type TaskPriority, type TaskCategory } from "@/types/task" // Import types

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    const nextSevenDays = new Date()
    nextSevenDays.setDate(today.getDate() + 7)

    // Format dates for SQL comparison (YYYY-MM-DD)
    const todayFormatted = today.toISOString().split('T')[0]
    const nextSevenDaysFormatted = nextSevenDays.toISOString().split('T')[0]

    let upcomingTasks
    if (session.role === 'admin') {
      // Admin sees all upcoming tasks that are not deleted and not completed
      upcomingTasks = await sql`
        SELECT id, title, description, status, priority, category, 
               due_date, created_at, 
               updated_at, approval_status, requested_by, approved_by, approved_at,
               is_deleted, deleted_at
        FROM tasks 
        WHERE due_date >= ${todayFormatted}::date 
          AND due_date <= ${nextSevenDaysFormatted}::date
          AND is_deleted = FALSE
          AND status != 'completed'
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
        WHERE due_date >= ${todayFormatted}::date 
          AND due_date <= ${nextSevenDaysFormatted}::date
          AND is_deleted = FALSE
          AND status != 'completed'
          AND (approval_status = 'approved' OR (approval_status = 'pending' AND requested_by = ${session.username}))
        ORDER BY due_date ASC, priority DESC
      `
    }

    // Map tasks to ensure consistent types and potentially add display labels
    const formattedTasks = upcomingTasks.map(task => ({
      ...task,
      priorityLabel: (priorityConfig as any)[task.priority as TaskPriority]?.label || task.priority,
      statusLabel: (statusConfig as any)[task.status as TaskStatus]?.label || task.status,
    }));

    return NextResponse.json(formattedTasks)
  } catch (error: any) {
    console.error("Error fetching upcoming tasks:", error)
    if (error.message && error.message.includes('relation "tasks" does not exist')) {
      return NextResponse.json({ error: "Database setup incomplete: 'tasks' table not found. Please run the setup SQL script." }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
