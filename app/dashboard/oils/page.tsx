import { getSession } from "@/lib/session"
import { getOils } from "./actions"
import { OilsTable } from "@/components/oils/oils-table"
import { Droplets } from "lucide-react"

export default async function OilsPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === "admin"

  const initialData = await getOils()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Droplets className="size-6" />
          </div>
          أصناف الزيوت والشحوم
        </h2>
        <p className="text-muted-foreground mt-2">
          إدارة الدليل المخزني لجميع أنواع الزيوت والشحوم، وحدات القياس، وحدود التنبيه للرصيد.
        </p>
      </div>

      <div className="mt-4">
        <OilsTable initialData={initialData} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
