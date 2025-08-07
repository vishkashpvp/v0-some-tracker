export type TaskStatus = "todo" | "in-progress" | "review" | "completed"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskCategory = "ui-design" | "components" | "features" | "testing" | "optimization" | "bug-fix"

export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  category: TaskCategory
  due_date: string
  created_at: string
  updated_at: string
  requested_by?: string
  approval_status?: string
  is_deleted?: boolean
  deleted_at?: string
}

export interface DeletionRequest {
  id: number;
  task_id: number;
  title: string;
  description: string;
  reason: string;
  requested_by: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
}
