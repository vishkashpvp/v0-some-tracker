"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Loader2, ListTodo } from 'lucide-react' // Added ListTodo icon
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button" // Import Button

type TaskStatus = "todo" | "in-progress" | "review" | "completed"
type TaskPriority = "low" | "medium" | "high" | "urgent"
type TaskCategory = "ui-design" | "components" | "features" | "testing" | "optimization" | "bug-fix"

interface Task {
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

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
}

const statusConfig = { // Added for better status display
  todo: { label: "To Do", color: "bg-gray-500/20 text-gray-700 dark:text-gray-300" },
  "in-progress": { label: "In Progress", color: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  review: { label: "Review", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-700 dark:text-green-300" },
}

export function UpcomingTasksWidget() {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/tasks/upcoming", { cache: 'no-store' })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch upcoming tasks")
        }
        const data = await response.json()
        setUpcomingTasks(data)
      } catch (err: any) {
        console.error("Error fetching upcoming tasks:", err)
        setError(err.message || "Could not load upcoming tasks.")
      } finally {
        setLoading(false)
      }
    }
    fetchUpcomingTasks()
  }, [])

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Tasks This Week</CardTitle>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : upcomingTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
            <ListTodo className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No upcoming tasks this week!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{task.title}</span>
                  <Badge className={priorityConfig[task.priority].color}>
                    {priorityConfig[task.priority].label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="outline" className={statusConfig[task.status].color}>
                    {statusConfig[task.status].label}
                  </Badge>
                </div>
                {task.approval_status === 'pending' && (
                  <Badge variant="outline" className="mt-1 text-xs border-yellow-500 text-yellow-700 dark:text-yellow-300">
                    Pending Approval
                  </Badge>
                )}
              </div>
            ))}
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = '/'}>
                View All Tasks
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
