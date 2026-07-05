import { getSession } from "@/lib/session"
import { getOilSupplies, getOils } from "./actions"
import { PackagePlus } from "lucide-react"
import { OilSuppliesTable } from "@/components/oil-supplies/oil-supplies-table"

export default async function OilSuppliesPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === "admin"

  const initialData = await getOilSupplies()
  const oils = await getOils()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PackagePlus className="size-6" />
          </div>
          توريدات الزيوت
        </h2>
        <p className="text-muted-foreground mt-2">
          إدارة ومتابعة عمليات توريد الزيوت.
        </p>
      </div>

      <div className="mt-4">
        <OilSuppliesTable
          initialData={initialData}
          oils={oils}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
