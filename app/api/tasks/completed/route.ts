import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const completedTasks = await sql`
      SELECT id, title, description, status, priority, category, 
             due_date, created_at, 
             updated_at, approval_status, requested_by, approved_by, approved_at,
             is_deleted, deleted_at
      FROM tasks 
      WHERE status = 'completed' AND is_deleted = FALSE
      ORDER BY updated_at DESC
    `
    return NextResponse.json(completedTasks)
  } catch (error: any) {
    console.error("Error fetching completed tasks:", error)
    if (error.message && error.message.includes('relation "tasks" does not exist')) {
      return NextResponse.json({ error: "Database setup incomplete: 'tasks' table not found. Please run the setup SQL script." }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error fetching completed tasks" }, { status: 500 })
  }
}
