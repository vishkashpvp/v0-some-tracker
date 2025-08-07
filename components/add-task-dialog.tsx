"use client"

import { useState } from "react"
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { type TaskPriority, type TaskCategory } from "@/types/task"

interface AddTaskDialogProps {
  sessionRole?: string;
  onTaskAdded: () => void;
}

export function AddTaskDialog({ sessionRole, onTaskAdded }: AddTaskDialogProps) {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    category: "features" as TaskCategory,
    dueDate: "",
  })
  const [error, setError] = useState("")

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      onTaskAdded() // Callback to refresh tasks in parent
      
      setIsAddTaskOpen(false)
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "features",
        dueDate: "",
      })
      
      if (sessionRole !== 'admin') {
        alert("Task submitted for admin approval!")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create task")
      console.error("Error creating task:", err)
    }
  }

  return (
    <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            {sessionRole === 'admin' 
              ? "Create a new task (will be approved automatically)"
              : "Create a new task (requires admin approval)"
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddTask}>
          <div className="grid gap-4 py-4">
            {error && <p className="text-destructive text-sm">{error}</p>}
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
  )
}
