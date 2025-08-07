import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  console.log("Hitting /api/tasks/pending GET route"); // Added for debugging
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      console.log("Admin access required for /api/tasks/pending, session:", session);
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const pendingTasks = await sql`
      SELECT id, title, description, status, priority, category, 
             estimated_hours, actual_hours, due_date, created_at, 
             updated_at, approval_status, requested_by, approved_by, approved_at,
             is_deleted, deleted_at
      FROM tasks 
      WHERE approval_status = 'pending' AND is_deleted = FALSE
      ORDER BY created_at DESC
    `
    console.log("Successfully fetched pending tasks:", pendingTasks.length);
    return NextResponse.json(pendingTasks)
  } catch (error) {
    console.error("Error fetching pending tasks:", error)
    // Ensure that even in case of an error, a JSON response is returned.
    return NextResponse.json({ error: "Internal server error fetching pending tasks" }, { status: 500 })
  }
}
