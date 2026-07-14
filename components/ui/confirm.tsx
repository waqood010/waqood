"use client"

import React, { useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "./dialog"
import { Button } from "./button"

export type ConfirmDialogProps = {
  open: boolean
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
}

export function ConfirmDialog({
  open,
  title = "تأكيد",
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button 
            onClick={onConfirm}
            variant={isDestructive ? "destructive" : "default"}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type ConfirmModalOptions = {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
}

export function confirmModal(message: string, options: ConfirmModalOptions = {}) {
  const { 
    title = "تأكيد", 
    confirmLabel = "تأكيد", 
    cancelLabel = "إلغاء",
    isDestructive = false 
  } = options

  return new Promise<boolean>((resolve) => {
    const container = document.createElement("div")
    document.body.appendChild(container)

    function Cleanup(root: ReturnType<typeof createRoot>) {
      try {
        root.unmount()
      } catch (e) {
        // ignore
      }
      if (container.parentNode) container.parentNode.removeChild(container)
    }

    const root = createRoot(container)

    const Confirm = () => {
      const [open, setOpen] = useState(true)

      useEffect(() => {
        return () => {
          // cleanup
        }
      }, [])

      const resolveAndClose = (value: boolean) => {
        setOpen(false)
        resolve(value)
        setTimeout(() => Cleanup(root), 200)
      }

      return (
        <ConfirmDialog
          open={open}
          title={title}
          description={message}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          isDestructive={isDestructive}
          onConfirm={() => resolveAndClose(true)}
          onCancel={() => resolveAndClose(false)}
        />
      )
    }

    root.render(React.createElement(Confirm))
  })
}
