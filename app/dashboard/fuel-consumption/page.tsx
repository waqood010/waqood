import { getSession } from "@/lib/session"
import { getFuelConsumptions, getStationsWithTanks } from "./actions"
import { FuelConsumptionTable } from "@/components/fuel-consumption/fuel-consumption-table"
import { Fuel } from "lucide-react"

export default async function FuelConsumptionPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === "admin"

  // Default dates: From the 1st of the current month to today
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  // Fetch data
  const initialData = await getFuelConsumptions({ from, to })
  const { stations, tanks } = await getStationsWithTanks()

  const formatDateString = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const defaultFrom = formatDateString(from)
  const defaultTo = formatDateString(to)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Fuel className="size-6" />
          </div>
          استهلاك الوقود
        </h2>
        <p className="text-muted-foreground mt-2">
          تسجيل الكميات المستهلكة أو المصروفة من الخزانات، مع إمكانية إضافة القراءات الفعلية للمقاييس ومطابقتها بالنظام.
        </p>
      </div>

      <div className="mt-4">
        <FuelConsumptionTable
          initialData={initialData}
          stations={stations}
          tanks={tanks}
          isAdmin={isAdmin}
          defaultFrom={defaultFrom}
          defaultTo={defaultTo}
        />
      </div>
    </div>
  )
}
