"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock } from 'lucide-react' // Import Lock icon

interface SwitchUserDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SwitchUserDialog({ isOpen, onOpenChange }: SwitchUserDialogProps) {
  const [targetUsername, setTargetUsername] = useState("")
  const [targetPassword, setTargetPassword] = useState("") // New state for password
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSwitch = async () => {
    setError("")
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername, password: targetPassword }), // Send password
      })

      const data = await response.json()

      if (response.ok) {
        // Force a hard navigation to ensure middleware runs and session is re-evaluated
        window.location.href = data.redirect || "/"
      } else {
        setError(data.error || "Failed to switch user.")
      }
    } catch (err) {
      console.error("Switch user client error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Switch User</DialogTitle>
          <DialogDescription>
            Enter the username and password of the account you wish to switch to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="target-username">Target Username</Label>
            <Input
              id="target-username"
              placeholder="e.g., veeru"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="target-password">Target Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="target-password"
                type="password"
                placeholder="Enter target password"
                value={targetPassword}
                onChange={(e) => setTargetPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSwitch} disabled={isLoading || !targetUsername.trim() || !targetPassword.trim()}>
            {isLoading ? "Switching..." : "Switch User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
