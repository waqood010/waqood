"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

export function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  ...props
}: CheckboxProps) {
  const [internalChecked, setInternalChecked] = React.useState(Boolean(defaultChecked))
  const isControlled = checked !== undefined
  const isChecked = isControlled ? checked : internalChecked

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextChecked = event.target.checked

    if (!isControlled) {
      setInternalChecked(nextChecked)
    }

    onCheckedChange?.(nextChecked)
    onChange?.(event)
  }

  return (
    <label className={cn("inline-flex items-center", className)}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="peer sr-only"
        {...props}
      />
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow transition-colors",
          isChecked ? "bg-primary text-primary-foreground" : "bg-background",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
        )}
      >
        <Check className={cn("h-3.5 w-3.5", isChecked ? "opacity-100" : "opacity-0")} />
      </span>
    </label>
  )
}
