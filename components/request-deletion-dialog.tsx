"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { type Task } from "@/types/task"

interface RequestDeletionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTask: Task | null;
  onDeletionRequested: () => void;
}

export function RequestDeletionDialog({ isOpen, onOpenChange, selectedTask, onDeletionRequested }: RequestDeletionDialogProps) {
  const [deletionReason, setDeletionReason] = useState("")
  const [error, setError] = useState("")

  const handleSubmitDeletionRequest = async () => {
    if (!selectedTask) return;
    setError("");
    try {
      const response = await fetch("/api/tasks/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selectedTask.id, reason: deletionReason }),
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create deletion request");
      }

      const result = await response.json()
      alert(result.message) // Show success message
      onDeletionRequested() // Callback to refresh tasks in parent
      onOpenChange(false) // Close dialog
      setDeletionReason("") // Reset reason
    } catch (err: any) {
      setError(err.message || "Failed to create deletion request")
      console.error("Error creating deletion request:", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Task Deletion</DialogTitle>
          <DialogDescription>
            Request admin approval to delete "{selectedTask?.title}". Please provide a reason for the deletion.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {error && <p className="text-destructive text-sm mb-2">{error}</p>}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitDeletionRequest}>
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
