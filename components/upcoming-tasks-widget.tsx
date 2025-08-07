"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Loader2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

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
          <p className="text-sm text-muted-foreground">No upcoming tasks this week!</p>
        ) : (
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{task.title}</span>
                  <span className="text-muted-foreground text-xs">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                    {task.approval_status === 'pending' && <span className="ml-1 text-yellow-600 dark:text-yellow-400">(Pending)</span>}
                  </span>
                </div>
                <Badge className={priorityConfig[task.priority].color}>
                  {priorityConfig[task.priority].label}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
