import { getSession } from "@/lib/session"
import { getTasks } from "./actions"
import { TasksTable } from "@/components/tasks/tasks-table"
import { ClipboardList } from "lucide-react"

export default async function TasksPage() {
  const session = await getSession()
  const tasks = await getTasks()
  const mapped = tasks.map((t: any) => ({ ...t, dueDate: new Date(t.dueDate).toISOString(), nextReminderAt: new Date(t.nextReminderAt).toISOString() }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-6" />
          </div>
          قائمة المهام
        </h2>
        <p className="text-muted-foreground mt-2">
          أضف مهام يومية أو أسبوعية أو شهرية أو ربع سنوية أو سنوية، وحدد مواعيد التنبيه والتكرار وراجع حالة المهمة بسهولة.
        </p>
      </div>

      <div className="mt-4">
        <TasksTable initialData={mapped} />
      </div>
    </div>
  )
}
