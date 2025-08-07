import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const deletedTasks = await sql`
      SELECT id, title, description, status, priority, category, 
             due_date, created_at, 
             updated_at, approval_status, requested_by, approved_by, approved_at,
             is_deleted, deleted_at
      FROM tasks 
      WHERE is_deleted = TRUE
      ORDER BY deleted_at DESC
    `
    return NextResponse.json(deletedTasks)
  } catch (error) {
    console.error("Error fetching deleted tasks:", error); // Added console.log
    console.log("Returning 500 error from /api/tasks/deleted"); // Added console.log
    return NextResponse.json({ error: "Internal server error fetching deleted tasks" }, { status: 500 })
  }
}
