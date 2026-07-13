import { getSession } from "@/lib/session"
import { getConsumers, getConsumersWithRatesAndOils } from "./actions"
import { ConsumersTable } from "@/components/consumers/consumers-table"
import { Users } from "lucide-react"

export default async function ConsumersPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === "admin"

  const initialData = await getConsumers()
  const { oils } = await getConsumersWithRatesAndOils()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          الجهات المستهلكة ومعدلات الاستهلاك
        </h2>
        <p className="text-muted-foreground mt-2">
          إدارة الورش والمراكز والوحدات الفنية وتحديد معدلات استهلاك الزيوت والشحوم لكل جهة.
        </p>
      </div>

      <div className="mt-4">
        <ConsumersTable initialData={initialData} oils={oils} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
