"use client"

import { useState } from "react"
import { createTask, updateTask } from "@/app/dashboard/tasks/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, X } from "lucide-react"

const repeatOptions = [
  { value: "once", label: "مرة واحدة" },
  { value: "daily", label: "يومية" },
  { value: "weekly", label: "أسبوعية" },
  { value: "monthly", label: "شهرية" },
  { value: "semiannual", label: "نصف سنوية" },
  { value: "quarterly", label: "ربع سنوية" },
  { value: "yearly", label: "سنوية" },
]

const reminderOffsets = [
  { value: 1, label: "قبل الموعد بيوم" },
  { value: 7, label: "قبل الموعد بأسبوع" },
  { value: 15, label: "قبل الموعد بـ 15 يوم" },
  { value: 30, label: "قبل الموعد بشهر" },
  { value: 5, label: "قبل الموعد بـ 5 أيام" },
]

const reminderIntervals = [
  { value: 6, label: "كل 6 ساعات" },
  { value: 12, label: "كل 12 ساعة" },
  { value: 24, label: "كل 24 ساعة" },
]

export function TaskForm({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
}) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(initialData?.status || "pending")
  const [customOffset, setCustomOffset] = useState<number | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const payload = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      dueDate: form.get("dueDate") as string,
      repeatFrequency: form.get("repeatFrequency") as string,
      reminderOffsetDays: Number(form.get("reminderOffsetDays")) || 1,
      reminderIntervalHours: Number(form.get("reminderIntervalHours")) || 24,
      status,
    }

    try {
      if (initialData) {
        await updateTask(initialData.id, payload)
        toast.success("تم تحديث المهمة بنجاح")
      } else {
        await createTask(payload)
        toast.success("تم إضافة المهمة بنجاح")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء حفظ المهمة")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{initialData ? "تعديل المهمة" : "إضافة مهمة جديدة"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان المهمة</Label>
              <Input id="title" name="title" required defaultValue={initialData?.title || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">موعد التنفيذ</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                defaultValue={initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف المهمة</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={initialData?.description || ""} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="repeatFrequency">تكرر المهمة</Label>
              <select
                id="repeatFrequency"
                name="repeatFrequency"
                defaultValue={initialData?.repeatFrequency || "once"}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-right"
              >
                {repeatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderOffsetDays">التنبيه قبل الموعد</Label>
              <select
                id="reminderOffsetDays"
                name="reminderOffsetDays"
                defaultValue={(initialData?.reminderOffsetDays ?? 1).toString()}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-right"
                onChange={(e) => {
                  if (e.target.value === "custom") setCustomOffset(Number(customOffset ?? 0))
                  else setCustomOffset(null)
                }}
              >
                {reminderOffsets.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">مخصص...</option>
              </select>
              {customOffset !== null && (
                <div className="mt-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="أدخل عدد الأيام"
                    value={customOffset ?? ""}
                    onChange={(e) => setCustomOffset(Number(e.target.value))}
                    className="w-40"
                  />
                  <input type="hidden" name="reminderOffsetDays" value={String(customOffset ?? (initialData?.reminderOffsetDays ?? 1))} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderIntervalHours">تكرار التذكير</Label>
              <select
                id="reminderIntervalHours"
                name="reminderIntervalHours"
                defaultValue={(initialData?.reminderIntervalHours ?? 24).toString()}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-right"
              >
                {reminderIntervals.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">حالة المهمة</Label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-right"
              >
                <option value="pending">معلقة</option>
                <option value="in_progress">جاري التنفيذ</option>
                <option value="done">منتهية</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>الحالة الحالية</Label>
              <div className="flex h-10 items-center rounded-lg border border-input bg-background px-3 text-sm text-right">
                {status === "pending" ? "معلقة" : status === "in_progress" ? "جاري التنفيذ" : "منتهية"}
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end w-full">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {initialData ? "تحديث المهمة" : "حفظ المهمة"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
