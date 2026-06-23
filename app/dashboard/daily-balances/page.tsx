import { getSession } from "@/lib/session"
import { getDailyBalances } from "./actions"
import { DailyBalancesView } from "@/components/daily-balances/daily-balances-view"
import { ClipboardList } from "lucide-react"

export default async function DailyBalancesPage({
  searchParams
}: {
  searchParams: { date?: string }
}) {
  const session = await getSession()
  // Admin checking can be done here if needed.

  // Date param logic (default to today)
  const targetDateStr = searchParams.date || new Date().toISOString().split("T")[0]

  // Fetch report data
  const reportData = await getDailyBalances(targetDateStr)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 print:hidden">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-6" />
          </div>
          العهدة اليومية (التقرير المجمع)
        </h2>
        <p className="text-muted-foreground mt-2">
          يجمع هذا التقرير جميع حركات الوارد والمنصرف والقياسات الفعلية المسجلة لكل خزان خلال يوم محدد، ويقوم بحساب الفروقات بشكل آلي.
        </p>
      </div>

      {/* Header for printing */}
      <div className="hidden print:flex flex-col items-center mb-6 border-b border-border pb-4">
        <h1 className="text-2xl font-bold">جهاز النقل — إدارة الوقود والزيوت</h1>
        <h2 className="text-xl mt-2">تقرير العهدة اليومية للوقود</h2>
        <p className="mt-1 font-bold" dir="ltr">التاريخ: {targetDateStr}</p>
      </div>

      <div className="mt-4">
        <DailyBalancesView 
          initialData={reportData} 
          targetDate={targetDateStr}
        />
      </div>
    </div>
  )
}
