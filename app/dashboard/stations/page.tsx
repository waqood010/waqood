import { getSession } from "@/lib/session"
import { getStations, getFuelTypes } from "./actions"
import { StationsTable } from "@/components/stations/stations-table"
import { Building2 } from "lucide-react"

export default async function StationsPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === "admin"

  // Fetch all required data for the page
  const initialStations = await getStations()
  const fuelTypes = await getFuelTypes()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-6" />
          </div>
          إدارة المحطات والخزانات
        </h2>
        <p className="text-muted-foreground mt-2">
          إدارة جميع محطات الوقود وإضافة وتعديل الخزانات التابعة لكل محطة ومتابعة سعتها.
        </p>
      </div>

      <div className="mt-4">
        <StationsTable 
          initialStations={initialStations} 
          fuelTypes={fuelTypes} 
          isAdmin={isAdmin} 
        />
      </div>
    </div>
  )
}
