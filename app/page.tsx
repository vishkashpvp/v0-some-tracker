"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Clock, Plus, Search, Filter, BarChart3, CheckCircle2, Circle, AlertCircle, Timer, LogOut, Heart, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PinInput } from "@/components/pin-input"
import { ThemeToggle } from "@/components/theme-toggle"

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
  estimated_hours: number
  actual_hours: number
  due_date: string
  created_at: string
  updated_at: string
  requested_by?: string
  approval_status?: string
  is_deleted?: boolean // Added for soft delete
  deleted_at?: string // Added for soft delete
}

const statusConfig = {
  todo: { label: "To Do", color: "bg-gray-500", icon: Circle },
  "in-progress": { label: "In Progress", color: "bg-blue-500", icon: Timer },
  review: { label: "Review", color: "bg-yellow-500", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle2 },
}

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
}

const categoryConfig = {
  "ui-design": { label: "UI Design", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  components: { label: "Components", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  features: { label: "Features", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  testing: { label: "Testing", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  optimization: { label: "Optimization", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  "bug-fix": { label: "Bug Fix", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
}

export default function FrontendTracker() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    category: "features" as TaskCategory,
    estimatedHours: 0,
    dueDate: "",
  })
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const [deletePin, setDeletePin] = useState("")
  const [pinError, setPinError] = useState("")
  const [session, setSession] = useState<{ username: string, role?: string } | null>(null)
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [deletionRequests, setDeletionRequests] = useState<any[]>([])
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]) // New state for deleted tasks
  const [activeTab, setActiveTab] = useState<'tasks' | 'pending' | 'deletion-requests' | 'deleted'>('tasks') // Added 'deleted' tab

  // Add state for deletion request dialog
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false)
  const [selectedTaskForDeletion, setSelectedTaskForDeletion] = useState<Task | null>(null)
  const [deletionReason, setDeletionReason] = useState("")

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session")
      if (response.ok) {
        const data = await response.json()
        setSession(data.user)
      }
    } catch (error) {
      console.error("Error fetching session:", error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")

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
        // Fetch pending tasks
        const pendingResponse = await fetch("/api/tasks/pending")
        const pendingContentType = pendingResponse.headers.get("content-type")
        if (!pendingContentType || !pendingContentType.includes("application/json")) {
          const errorText = await pendingResponse.text()
          console.error("Non-JSON response from /api/tasks/pending:", pendingResponse.status, errorText)
          setError("Failed to load pending tasks due to unexpected server response. Check server logs for /api/tasks/pending.")
        } else if (!pendingResponse.ok) {
          const errorData = await pendingResponse.json()
          console.error("API error response for pending tasks:", errorData)
          setError(errorData.error || "Failed to load pending tasks due to server error.")
        } else {
          const pendingData = await pendingResponse.json()
          setPendingTasks(pendingData)
        }

        // Fetch deletion requests
        const deletionResponse = await fetch("/api/tasks/deletion-requests")
        const deletionContentType = deletionResponse.headers.get("content-type")
        if (!deletionContentType || !deletionContentType.includes("application/json")) {
          const errorText = await deletionResponse.text()
          console.error("Non-JSON response from /api/tasks/deletion-requests:", deletionResponse.status, errorText)
          setError("Failed to load deletion requests due to unexpected server response. Check server logs for /api/tasks/deletion-requests.")
        } else if (!deletionResponse.ok) {
          const errorData = await deletionResponse.json()
          console.error("API error response for deletion requests:", errorData)
          setError(errorData.error || "Failed to load deletion requests due to server error.")
        } else {
          const deletionData = await deletionResponse.json()
          setDeletionRequests(deletionData)
        }

        // Fetch deleted tasks
        const deletedResponse = await fetch("/api/tasks/deleted")
        const deletedContentType = deletedResponse.headers.get("content-type")
        if (!deletedContentType || !deletedContentType.includes("application/json")) {
          const errorText = await deletedResponse.text()
          console.error("Non-JSON response from /api/tasks/deleted:", deletedResponse.status, errorText)
          setError("Failed to load deleted tasks due to unexpected server response. Check server logs for /api/tasks/deleted.")
        } else if (!deletedResponse.ok) {
          const errorData = await deletedResponse.json()
          console.error("API error response for deleted tasks:", errorData)
          setError(errorData.error || "Failed to load deleted tasks due to server error.")
        } else {
          const deletedData = await deletedResponse.json()
          setDeletedTasks(deletedData)
        }
      }
    } catch (error) {
      setError("Failed to load tasks. Please check your network connection and server logs.")
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

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

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getTaskStats = () => {
    // Stats should only count non-deleted tasks
    const activeTasks = tasks.filter(t => !t.is_deleted);
    const total = activeTasks.length
    const completed = activeTasks.filter((t) => t.status === "completed").length
    const inProgress = activeTasks.filter((t) => t.status === "in-progress").length
    const overdue = activeTasks.filter((t) => new Date(t.due_date) < new Date() && t.status !== "completed").length

    const totalEstimated = activeTasks.reduce((sum, task) => sum + task.estimated_hours, 0)
    const totalActual = activeTasks.reduce((sum, task) => sum + task.actual_hours, 0)

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalEstimated,
      totalActual,
      efficiency: totalEstimated > 0 ? Math.round((totalEstimated / Math.max(totalActual, 1)) * 100) : 100,
    }
  }

  const stats = getTaskStats()

  const updateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update task")

      const updatedTask = await response.json()
      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)))
    } catch (error) {
      setError("Failed to update task")
      console.error("Error updating task:", error)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      })

      if (!response.ok) throw new Error("Failed to create task")

      const createdTask = await response.json()
      
      // If user is admin, add to tasks list immediately
      // If user is regular user, the task will be pending and won't show in main list
      if (session?.role === 'admin') {
        setTasks([createdTask, ...tasks])
      } else {
        // For regular users, show a success message
        alert("Task submitted for admin approval!")
      }
      
      setIsAddTaskOpen(false)
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "features",
        estimatedHours: 0,
        dueDate: "",
      })
      
      // Refresh data to update pending tasks count for admin
      if (session?.role === 'admin') {
        fetchTasks()
      }
    } catch (error) {
      setError("Failed to create task")
      console.error("Error creating task:", error)
    }
  }

  const handleDeleteAllTasks = async () => {
    if (!deletePin || deletePin.length !== 5) {
      setPinError("Please enter the 5-digit PIN")
      return
    }

    setIsDeleting(true)
    setPinError("")
    
    try {
      const response = await fetch("/api/tasks/delete-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: deletePin }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          setPinError("Invalid PIN. Please try again.")
        } else {
          throw new Error(result.error || "Failed to delete all tasks")
        }
        return
      }

      // Update state to reflect soft deletion
      setTasks(tasks.map(task => ({ ...task, is_deleted: true, deleted_at: new Date().toISOString() })));
      setDeletedTasks([...tasks.map(task => ({ ...task, is_deleted: true, deleted_at: new Date().toISOString() })), ...deletedTasks]);
      
      setIsDeleteAllOpen(false)
      setDeletePin("")
      setPinError("")
      setError("")
    } catch (error) {
      setError("Failed to delete all tasks")
      console.error("Error deleting all tasks:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTaskApproval = async (taskId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch("/api/tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action }),
      })

      if (!response.ok) throw new Error("Failed to process approval")

      // Refresh data
      fetchTasks()
      
      setError("")
    } catch (error) {
      setError(`Failed to ${action} task`)
      console.error(`Error ${action}ing task:`, error)
    }
  }

  const handleDeletionRequest = async (taskId: number, reason: string) => {
    try {
      const response = await fetch("/api/tasks/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, reason }),
      })

      if (!response.ok) throw new Error("Failed to create deletion request")

      const result = await response.json()
      setError("")
      
      // Show success message
      alert(result.message)
      
      // Refresh data if admin
      if (session?.role === 'admin') {
        fetchTasks()
      }
    } catch (error) {
      setError("Failed to create deletion request")
      console.error("Error creating deletion request:", error)
    }
  }

  const handleDeletionRequestApproval = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/tasks/deletion-requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) throw new Error("Failed to process deletion request")

      // Refresh data
      fetchTasks()
      setError("")
    } catch (error) {
      setError(`Failed to ${action} deletion request`)
      console.error(`Error ${action}ing deletion request:`, error)
    }
  }

  // Add this function to handle deletion request dialog
  const openDeletionDialog = (task: Task) => {
    setSelectedTaskForDeletion(task)
    setDeletionReason("")
    setDeletionDialogOpen(true)
  }

  // Add this function to submit deletion request
  const submitDeletionRequest = async () => {
    if (!selectedTaskForDeletion) return
    
    await handleDeletionRequest(selectedTaskForDeletion.id, deletionReason)
    setDeletionDialogOpen(false)
    setSelectedTaskForDeletion(null)
    setDeletionReason("")
  }

  useEffect(() => {
    fetchTasks()
    fetchSession()
  }, [])

  useEffect(() => {
    if (session) {
      fetchTasks()
    }
  }, [session])

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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Frontend Development Tracker</h1>
            <p className="text-muted-foreground mt-1">
              {session?.role === 'admin' ? 'Admin Dashboard - Manage tasks and approvals' : 'Track progress and manage your tasks'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>{session?.username || "User"} ({session?.role === 'admin' ? 'Admin' : 'User'})</span>
            </div>
            <ThemeToggle />
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>
                    {session?.role === 'admin' 
                      ? "Create a new task (will be approved automatically)"
                      : "Create a new task (requires admin approval)"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTask}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter task title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter task description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value: TaskPriority) => setNewTask({ ...newTask, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newTask.category}
                          onValueChange={(value: TaskCategory) => setNewTask({ ...newTask, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ui-design">UI Design</SelectItem>
                            <SelectItem value="components">Components</SelectItem>
                            <SelectItem value="features">Features</SelectItem>
                            <SelectItem value="testing">Testing</SelectItem>
                            <SelectItem value="optimization">Optimization</SelectItem>
                            <SelectItem value="bug-fix">Bug Fix</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="estimatedHours">Estimated Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        placeholder="0"
                        value={newTask.estimatedHours}
                        onChange={(e) =>
                          setNewTask({ ...newTask, estimatedHours: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add Task</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {session?.role === 'admin' && (
              <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete All Tasks
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete All Tasks</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. Enter the 5-digit PIN to permanently delete all tasks from the database.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="space-y-4">
                      <div className="text-center">
                        <Label className="text-sm font-medium">Enter PIN</Label>
                        <div className="mt-2">
                          <PinInput
                            length={5}
                            value={deletePin}
                            onChange={setDeletePin}
                            onComplete={(pin) => setDeletePin(pin)}
                          />
                        </div>
                        {pinError && (
                          <p className="text-sm text-destructive mt-2">{pinError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsDeleteAllOpen(false)
                        setDeletePin("")
                        setPinError("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAllTasks} 
                      disabled={isDeleting || deletePin.length !== 5}
                    >
                      {isDeleting ? "Deleting..." : "Delete All Tasks"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Admin Tabs */}
        {session?.role === 'admin' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex space-x-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'tasks'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Tasks ({tasks.filter(t => !t.is_deleted).length})
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
            </CardContent>
          </Card>
        )}

        {/* Render content based on active tab */}
        {(session?.role !== 'admin' || activeTab === 'tasks') && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completed} completed, {stats.inProgress} in progress
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
                  <CardTitle className="text-sm font-medium">Time Efficiency</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.efficiency}%</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalActual}h actual vs {stats.totalEstimated}h estimated
                  </p>
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
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
              <CardHeader>
                <CardTitle className="text-lg">Tasks ({filteredTasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTasks.map((task) => {
                    const StatusIcon = statusConfig[task.status].icon
                    const isOverdue = new Date(task.due_date) < new Date() && task.status !== "completed"
                    const isPending = task.approval_status === 'pending'

                    return (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-4 transition-colors hover:bg-muted/50 ${
                          isOverdue ? "border-destructive bg-destructive/10" : 
                          isPending ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" : 
                          "border-border"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <StatusIcon
                                className={`h-5 w-5 ${statusConfig[task.status].color.replace("bg-", "text-")}`}
                              />
                              <h3 className="font-semibold text-foreground">{task.title}</h3>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                              {isPending && (
                                <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-300">
                                  Pending Approval
                                </Badge>
                              )}
                            </div>

                            <p className="text-muted-foreground text-sm">{task.description}</p>

                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={priorityConfig[task.priority].color}>
                                {priorityConfig[task.priority].label}
                              </Badge>
                              <Badge variant="outline" className={categoryConfig[task.category].color}>
                                {categoryConfig[task.category].label}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                {task.due_date}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {task.actual_hours}h / {task.estimated_hours}h
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {!isPending && (
                              <Select
                                value={task.status}
                                onValueChange={(value: TaskStatus) => updateTaskStatus(task.id, value)}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">To Do</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="review">Review</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            {session?.role !== 'admin' && !isPending && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeletionDialog(task)}
                              >
                                Request Deletion
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
            <CardHeader>
              <CardTitle className="text-lg">Deletion Requests ({deletionRequests.length})</CardTitle>
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
                            <CalendarDays className="h-4 w-4" />
                            {task.due_date}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {task.actual_hours}h / {task.estimated_hours}h
                          </div>
                          {task.deleted_at && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <span className="font-medium">Deleted:</span> {new Date(task.deleted_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* You can add a "Restore" button here if needed in the future */}
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
      
      <Dialog open={deletionDialogOpen} onOpenChange={setDeletionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Task Deletion</DialogTitle>
            <DialogDescription>
              Request admin approval to delete "{selectedTaskForDeletion?.title}". Please provide a reason for the deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason for deletion</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why this task should be deleted..."
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitDeletionRequest}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
