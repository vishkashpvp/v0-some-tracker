"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, CheckCircle2, AlertCircle, LogOut, Heart, User, ChevronDown, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Import new components and utilities
import { AddTaskDialog } from "@/components/add-task-dialog"
import { DeleteAllTasksDialog } from "@/components/delete-all-tasks-dialog"
import { RequestDeletionDialog } from "@/components/request-deletion-dialog"
import { TaskCard } from "@/components/task-card"

// Import types and constants
import { type Task, type TaskStatus, type DeletionRequest } from "@/types/task"
import { statusConfig, priorityConfig, categoryConfig } from "@/lib/constants"

// Add the import for Badge
import { Badge } from "@/components/ui/badge"

export default function FrontendTracker() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const router = useRouter()
  const [session, setSession] = useState<{ username: string, role?: string } | null>(null)
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([])
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<'tasks' | 'pending' | 'deletion-requests' | 'deleted' | 'completed'>('tasks')

  // State for deletion request dialog
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false)
  const [selectedTaskForDeletion, setSelectedTaskForDeletion] = useState<Task | null>(null)

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setSession(data.user)
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error fetching session:", error)
      router.push("/login")
    }
  }, [router])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/tasks", { cache: 'no-store' })

      if (response.status === 401) {
        router.push("/login")
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text()
        console.error("Non-JSON response from /api/tasks:", response.status, errorText)
        setError(`Server returned an unexpected response (Status: ${response.status}). Please check server logs.`)
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API error response:", errorData)
        setError(errorData.error || "Failed to fetch tasks due to a server error.")
        return
      }

      const data = await response.json()
      setTasks(data)

      if (session?.role === 'admin') {
        const [pendingResponse, deletionResponse, deletedResponse, completedResponse] = await Promise.all([
          fetch("/api/tasks/pending", { cache: 'no-store' }),
          fetch("/api/tasks/deletion-requests", { cache: 'no-store' }),
          fetch("/api/tasks/deleted", { cache: 'no-store' }),
          fetch("/api/tasks/completed", { cache: 'no-store' })
        ]);

        const handleAdminFetchResponse = async (response: Response, setter: React.Dispatch<React.SetStateAction<any[]>>, errorMessage: string) => {
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const errorText = await response.text();
            console.error(`Non-JSON response for ${errorMessage}:`, response.status, errorText);
            setError(`Failed to load ${errorMessage} due to unexpected server response.`);
          } else if (!response.ok) {
            const errorData = await response.json();
            console.error(`API error response for ${errorMessage}:`, errorData);
            setError(errorData.error || `Failed to load ${errorMessage} due to server error.`);
          } else {
            const data = await response.json();
            setter(data);
          }
        };

        await handleAdminFetchResponse(pendingResponse, setPendingTasks, "pending tasks");
        await handleAdminFetchResponse(deletionResponse, setDeletionRequests, "deletion requests");
        await handleAdminFetchResponse(deletedResponse, setDeletedTasks, "deleted tasks");
        await handleAdminFetchResponse(completedResponse, setCompletedTasks, "completed tasks");
      }
    } catch (error) {
      setError("Failed to load tasks. Please check your network connection and server logs.")
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }, [router, session?.role]) // Depend on session.role to re-fetch admin-specific data

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

    if (session?.role !== 'admin' && task.approval_status === 'pending' && task.requested_by === session?.username) {
      return matchesSearch && matchesStatus && matchesPriority;
    }
    return matchesSearch && matchesStatus && matchesPriority && !task.is_deleted && (activeTab !== 'tasks' || task.status !== 'completed');
  })

  const getTaskStats = () => {
    const activeTasks = tasks.filter(t => !t.is_deleted);
    const total = activeTasks.length
    const completed = activeTasks.filter((t) => t.status === "completed").length
    const inProgress = activeTasks.filter((t) => t.status === "in-progress").length
    const overdue = activeTasks.filter((t) => new Date(t.due_date) < new Date() && t.status !== "completed").length

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  const stats = getTaskStats()

  const updateTaskStatus = useCallback(async (taskId: number, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }

      fetchTasks(); // Re-fetch all data to ensure consistency across tabs
    } catch (err: any) {
      setError(err.message || "Failed to update task")
      console.error("Error updating task:", err)
    }
  }, [fetchTasks])

  const handleTaskApproval = useCallback(async (taskId: number, action: 'approve' | 'reject') => {
    console.log(`Client: Attempting to ${action} task ID: ${taskId}`);
    try {
      const response = await fetch("/api/tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action }),
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Client: Failed to ${action} task. Server response:`, errorData);
        throw new Error(errorData.error || "Failed to process approval");
      }

      console.log(`Client: Task ${action}ed successfully. Refreshing data.`);
      fetchTasks()
      setError("")
    } catch (err: any) {
      setError(err.message || `Failed to ${action} task`)
      console.error(`Client: Error ${action}ing task:`, err)
    }
  }, [fetchTasks])

  const handleDeletionRequestApproval = useCallback(async (requestId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/tasks/deletion-requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process deletion request");
      }

      fetchTasks()
      setError("")
    } catch (err: any) {
      setError(err.message || `Failed to ${action} deletion request`)
      console.error(`Error ${action}ing deletion request:`, err)
    }
  }, [fetchTasks])

  const openDeletionDialog = useCallback((task: Task) => {
    setSelectedTaskForDeletion(task)
    setDeletionDialogOpen(true)
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (session) {
      fetchTasks()
    }
  }, [session, fetchTasks])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Development Tracker</h1>
            <p className="text-muted-foreground mt-1">
              {session?.role === 'admin' ? 'Admin Dashboard - Manage tasks and approvals' : 'Track progress and manage your tasks'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 px-3">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  <span>{session?.username || "User"}</span>
                  <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Admin Tabs */}
        {session?.role === 'admin' && (
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Tasks ({tasks.filter(t => !t.is_deleted && t.status !== 'completed').length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending Approval ({pendingTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('deletion-requests')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'deletion-requests'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Deletion Requests ({deletionRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed Tasks ({completedTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('deleted')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'deleted'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Deleted Tasks ({deletedTasks.length})
            </button>
          </div>
        )}

        {/* Render content based on active tab */}
        {(session?.role !== 'admin' || activeTab === 'tasks') && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {session?.role === 'admin' ? 'Pending Tasks' : 'My Active Tasks'}
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {session?.role === 'admin' ? pendingTasks.length : tasks.filter(t => !t.is_deleted && t.approval_status === 'approved').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {session?.role === 'admin' ? 'Tasks awaiting approval' : 'Tasks not deleted or pending approval'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completionRate}%</div>
                  <Progress value={stats.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
                  <p className="text-xs text-muted-foreground">Require immediate attention</p>
                </CardContent>
              </Card>
            </div>
            
            

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters & Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Trash2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Tasks List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Tasks ({filteredTasks.length})</CardTitle>
                <AddTaskDialog sessionRole={session?.role} onTaskAdded={fetchTasks} />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      sessionRole={session?.role}
                      updateTaskStatus={updateTaskStatus}
                      openDeletionDialog={openDeletionDialog}
                    />
                  ))}

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks found matching your filters.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Pending Tasks Section (Admin Only) */}
        {session?.role === 'admin' && activeTab === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Tasks ({pendingTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        <p className="text-muted-foreground text-sm">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={priorityConfig[task.priority].color}>
                            {priorityConfig[task.priority].label}
                          </Badge>
                          <Badge variant="outline" className={categoryConfig[task.category].color}>
                            {categoryConfig[task.category].label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">Requested by: {task.requested_by}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleTaskApproval(task.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleTaskApproval(task.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No pending tasks for approval.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deletion Requests Section (Admin Only) */}
        {session?.role === 'admin' && activeTab === 'deletion-requests' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Deletion Requests ({deletionRequests.length})</CardTitle>
              <DeleteAllTasksDialog onTasksDeleted={fetchTasks} />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deletionRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-foreground">{request.title}</h3>
                        <p className="text-muted-foreground text-sm">{request.description}</p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Reason:</strong> {request.reason || 'No reason provided'}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          Requested by: {request.requested_by}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletionRequestApproval(request.id, 'approve')}
                        >
                          Approve Deletion
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletionRequestApproval(request.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {deletionRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No pending deletion requests.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Tasks Section (Admin Only) */}
        {session?.role === 'admin' && activeTab === 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completed Tasks ({completedTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    sessionRole={session?.role}
                    updateTaskStatus={updateTaskStatus}
                    openDeletionDialog={openDeletionDialog}
                  />
                ))}
                {completedTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks have been completed yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deleted Tasks Section (Admin Only) */}
        {session?.role === 'admin' && activeTab === 'deleted' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deleted Tasks ({deletedTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deletedTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 opacity-70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Trash2 className="h-5 w-5 text-destructive" />
                          <h3 className="font-semibold text-foreground line-through">{task.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm line-through">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={priorityConfig[task.priority].color}>
                            {priorityConfig[task.priority].label}
                          </Badge>
                          <Badge variant="outline" className={categoryConfig[task.category].color}>
                            {categoryConfig[task.category].label}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Trash2 className="h-4 w-4" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                          {task.deleted_at && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <span className="font-medium">Deleted:</span> {new Date(task.deleted_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {deletedTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks have been deleted yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <RequestDeletionDialog
        isOpen={deletionDialogOpen}
        onOpenChange={setDeletionDialogOpen}
        selectedTask={selectedTaskForDeletion}
        onDeletionRequested={fetchTasks}
      />

      <Footer />
    </div>
  )
}

// Footer component (remains the same)
function Footer() {
  return (
    <footer className="mt-8 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
      <div className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Frontend Development Tracker. All rights reserved.
      </div>
      <ThemeToggle />
    </footer>
  );
}
