import { getSession } from "@/lib/session"
import { getFuelSupplies, getStationsWithTanks } from "./actions"
import { FuelSuppliesTable } from "@/components/fuel-supplies/fuel-supplies-table"
import { TruckIcon } from "lucide-react"

export default async function FuelSuppliesPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role !== "user"

  // Fetch data
  const initialData = await getFuelSupplies()
  const { stations, tanks } = await getStationsWithTanks()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TruckIcon className="size-6" />
          </div>
          وارد الوقود
        </h2>
        <p className="text-muted-foreground mt-2">
          إدارة وتتبع جميع شحنات وتوريدات الوقود الواردة إلى المحطات.
        </p>
      </div>

      <div className="mt-4">
        <FuelSuppliesTable
          initialData={initialData}
          stations={stations}
          tanks={tanks}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
