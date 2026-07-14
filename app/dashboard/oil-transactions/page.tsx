import { getSession } from "@/lib/session"
import { getOilTransactions, getConsumersAndOils } from "./actions"
import { HandCoins } from "lucide-react"
import { OilTransactionsTable } from "@/components/oil-transactions/oil-transactions-table"

export default async function OilTransactionsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const session = await getSession()
  const isAdmin = session?.user?.role !== "user"

  // Default dates: From the 1st of the current month to today
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const formatDateString = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const defaultFrom = formatDateString(from)
  const defaultTo = formatDateString(to)

  const consumerId = searchParams?.consumerId ? Number(searchParams.consumerId as string) : undefined
  const oilId = searchParams?.oilId ? Number(searchParams.oilId as string) : undefined
  const fromParam = searchParams?.from ? new Date(searchParams.from as string) : from
  const toParam = searchParams?.to ? new Date(searchParams.to as string) : to
  const search = searchParams?.q ? String(searchParams.q) : undefined
  const page = searchParams?.page ? Number(searchParams.page as string) : 1
  const pageSize = searchParams?.pageSize ? Number(searchParams.pageSize as string) : 25

  const result = await getOilTransactions({
    consumerId,
    oilId,
    from: fromParam,
    to: toParam,
    search,
    page,
    pageSize,
  })

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
          initialData={result.data}
          consumers={consumers}
          oils={oils}
          isAdmin={isAdmin}
          page={result.page}
          pageSize={result.pageSize}
          hasMore={result.hasMore}
          defaultFrom={defaultFrom}
          defaultTo={defaultTo}
        />
      </div>
    </div>
  )
}
