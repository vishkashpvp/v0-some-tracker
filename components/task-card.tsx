"use client"

import { CalendarDays, Circle, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { statusConfig, priorityConfig, categoryConfig } from "@/lib/constants"
import { isTaskLocked } from "@/lib/task-helpers"
import { type Task, type TaskStatus } from "@/types/task"
import * as LucideIcons from 'lucide-react'; // Import all icons from lucide-react

interface TaskCardProps {
  task: Task;
  sessionRole?: string;
  updateTaskStatus: (taskId: number, newStatus: TaskStatus) => Promise<void>;
  openDeletionDialog: (task: Task) => void;
}

export function TaskCard({ task, sessionRole, updateTaskStatus, openDeletionDialog }: TaskCardProps) {
  const StatusIconComponent = (LucideIcons as any)[statusConfig[task.status].icon] || Circle;
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== "completed";
  const isPending = task.approval_status === 'pending';
  const locked = isTaskLocked(task);

  return (
    <div
      key={task.id}
      className={`border rounded-lg p-4 transition-colors hover:bg-muted/50 ${
        isOverdue ? "border-destructive bg-destructive/10" :
        isPending ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" :
        locked ? "border-gray-300 bg-gray-100 dark:bg-gray-900 opacity-70" :
        "border-border"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <StatusIconComponent
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
            {locked && (
              <Badge variant="secondary" className="text-xs">
                Locked
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
              {new Date(task.due_date).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isPending && (
            <Select
              value={task.status}
              onValueChange={(value: TaskStatus) => updateTaskStatus(task.id, value)}
              disabled={locked}
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

          {sessionRole !== 'admin' && !isPending && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openDeletionDialog(task)}
              disabled={task.status === 'completed' || locked}
            >
              Request Deletion
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
