"use client"

import { useState } from "react"
import { deleteTask, acknowledgeTaskReminder, changeTaskStatus } from "@/app/dashboard/tasks/actions"
import { TaskForm } from "./task-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, CheckCircle2, Pause, BellRing, Plus } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"

const statusLabel = {
  pending: "معلقة",
  in_progress: "جاري التنفيذ",
  done: "منتهية",
}

const repeatLabel = {
  once: "مرة واحدة",
  daily: "يومية",
  weekly: "أسبوعية",
  monthly: "شهرية",
  quarterly: "ربع سنوية",
  yearly: "سنوية",
}

type TaskStatus = "pending" | "in_progress" | "done"
type TaskRepeat = "once" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly"

type TaskItem = {
  id: number
  title: string
  description?: string | null
  dueDate: string
  repeatFrequency: TaskRepeat
  reminderOffsetDays: number
  reminderIntervalHours: number
  nextReminderAt: string
  status: TaskStatus
  isRead: boolean
}

export function TasksTable({ initialData }: { initialData: TaskItem[] }) {
  const [data, setData] = useState<TaskItem[]>(initialData)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TaskItem | null>(null)

  const now = new Date()
  const filteredData = data.filter((item) =>
    item.title.includes(search) ||
    item.description?.includes(search) ||
    statusLabel[item.status].includes(search)
  )

  const handleDelete = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من حذف هذه المهمة؟"))) return
    try {
      await deleteTask(id)
      setData(data.filter((item) => item.id !== id))
      toast.success("تم حذف المهمة")
    } catch (err: any) {
      toast.error(err?.message || "فشل في حذف المهمة")
    }
  }

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeTaskReminder(id)
      setData(data.map((item) => item.id === id ? { ...item, isRead: true, nextReminderAt: new Date(Date.now() + (item.reminderIntervalHours || 24) * 60 * 60 * 1000).toISOString() } : item))
      toast.success("تم تأجيل التذكير")
    } catch (err: any) {
      toast.error(err?.message || "فشل في تأجيل التذكير")
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await changeTaskStatus(id, status)
      window.location.reload()
    } catch (err: any) {
      toast.error(err?.message || "فشل في تحديث حالة المهمة")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Input
            placeholder="ابحث في المهام بالعنوان أو الحالة..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => { setEditingItem(null); setFormOpen(true) }}>
          <Plus className="ml-2 size-4" /> إضافة مهمة
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">المهمة</th>
              <th className="px-4 py-3 font-medium">الموعد</th>
              <th className="px-4 py-3 font-medium">التكرار</th>
              <th className="px-4 py-3 font-medium">التذكير</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">التنبيه القادم</th>
              <th className="px-4 py-3 font-medium text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  لا توجد مهام تطابق البحث
                </td>
              </tr>
            ) : (
              filteredData.map((item) => {
                const isReminderActive = new Date(item.nextReminderAt) <= now && item.status === "pending"

                return (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 max-w-sm break-words">
                      <div className="font-semibold">{item.title}</div>
                      {item.description && <div className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.description}</div>}
                    </td>
                    <td className="px-4 py-3">{new Date(item.dueDate).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3">{repeatLabel[item.repeatFrequency] || "غير محدد"}</td>
                    <td className="px-4 py-3">قبل {item.reminderOffsetDays} يوم</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.status === "done" ? "bg-emerald-100 text-emerald-700" : item.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-800"}`}>
                        {statusLabel[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span>{new Date(item.nextReminderAt).toLocaleString("ar-EG")}</span>
                        {isReminderActive && (
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-destructive">تنبيه نشط</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isReminderActive && (
                          <Button size="icon" variant="outline" onClick={() => handleAcknowledge(item.id)}>
                            <BellRing className="size-4" />
                          </Button>
                        )}
                        {item.status !== "done" && (
                          <Button size="icon" variant="ghost" onClick={() => handleStatusChange(item.id, item.status === "pending" ? "in_progress" : "done")}> 
                            {item.status === "pending" ? <Pause className="size-4" /> : <CheckCircle2 className="size-4" />}
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setFormOpen(true) }}>
                          <Edit className="size-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <TaskForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) window.location.reload()
          }}
          initialData={editingItem}
        />
      )}
    </div>
  )
}
