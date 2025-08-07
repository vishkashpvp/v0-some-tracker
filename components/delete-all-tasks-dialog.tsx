"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PinInput } from "@/components/pin-input"

interface DeleteAllTasksDialogProps {
  onTasksDeleted: () => void;
}

export function DeleteAllTasksDialog({ onTasksDeleted }: DeleteAllTasksDialogProps) {
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletePin, setDeletePin] = useState("")
  const [pinError, setPinError] = useState("")

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
        cache: 'no-store'
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

      onTasksDeleted() // Callback to refresh tasks in parent
      
      setIsDeleteAllOpen(false)
      setDeletePin("")
      setPinError("")
    } catch (error: any) {
      setPinError(error.message || "Failed to delete all tasks") // Use pinError for general errors in this dialog
      console.error("Error deleting all tasks:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
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
  )
}
