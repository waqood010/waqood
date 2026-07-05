import { getSession } from "@/lib/session"
import { getOilTransactions, getConsumersAndOils } from "./actions"
import { HandCoins } from "lucide-react"
import { OilTransactionsTable } from "@/components/oil-transactions/oil-transactions-table"

export default async function OilTransactionsPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === "admin"

  const initialData = await getOilTransactions()
  const { consumers, oils } = await getConsumersAndOils()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HandCoins className="size-6" />
          </div>
          صرف الزيوت
        </h2>
        <p className="text-muted-foreground mt-2">
          إدارة ومتابعة عمليات صرف الزيوت للجهات المستهلكة.
        </p>
      </div>

      <div className="mt-4">
        <OilTransactionsTable
          initialData={initialData}
          consumers={consumers}
          oils={oils}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
