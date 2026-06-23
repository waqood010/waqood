import { getSession } from "@/lib/session"
import { getFuelConsumptions, getStationsWithTanks } from "./actions"
import { FuelConsumptionTable } from "@/components/fuel-consumption/fuel-consumption-table"
import { Fuel } from "lucide-react"

export default async function FuelConsumptionPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === "admin"

  // Fetch data
  const initialData = await getFuelConsumptions()
  const { stations, tanks } = await getStationsWithTanks()

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
        />
      </div>
    </div>
  )
}
