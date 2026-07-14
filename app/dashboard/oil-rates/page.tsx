import { getSession } from "@/lib/session"
import { Gauge } from "lucide-react"
import { getOilRates, getConsumersAndOils } from "./actions"
import { OilRatesTable } from "@/components/oil-rates/oil-rates-table"

export default async function OilRatesPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role !== "user"

  const initialData = await getOilRates()
  const { consumers, oils } = await getConsumersAndOils()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gauge className="size-6" />
          </div>
          معدلات الاستهلاك
        </h2>
        <p className="text-muted-foreground mt-2">
          إدارة وتحديد معدلات استهلاك الزيوت للجهات المختلفة.
        </p>
      </div>

      <div className="mt-4">
        <OilRatesTable
          initialData={initialData}
          consumers={consumers}
          oils={oils}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
