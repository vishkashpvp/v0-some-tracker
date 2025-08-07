"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface PinInputProps {
  length: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
}

export function PinInput({ length, value, onChange, onComplete }: PinInputProps) {
  const [pins, setPins] = useState<string[]>(Array(length).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Update pins when value changes externally
    // Ensure value is a string before splitting
    const safeValue = value || ""; // Defensive check
    const newPins = safeValue.split("").concat(Array(length).fill("")).slice(0, length)
    setPins(newPins)
  }, [value, length])

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    if (!/^\d*$/.test(newValue)) return

    const newPins = [...pins]
    newPins[index] = newValue.slice(-1) // Only take the last character

    setPins(newPins)
    const pinValue = newPins.join("")
    onChange(pinValue)

    // Auto-focus next input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete when all pins are filled
    if (pinValue.length === length && onComplete) {
      onComplete(pinValue)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pins[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    // Ensure pastedData is a string before splitting
    const safePastedData = pastedData || ""; // Defensive check
    const newPins = safePastedData.split("").concat(Array(length).fill("")).slice(0, length)
    setPins(newPins)
    onChange(pastedData)

    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[nextIndex]?.focus()

    if (pastedData.length === length && onComplete) {
      onComplete(pastedData)
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {pins.map((pin, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={pin}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-lg font-mono"
          autoComplete="off"
        />
      ))}
    </div>
  )
}
