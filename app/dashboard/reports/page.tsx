import { getSession } from "@/lib/session"
import { BarChart3 } from "lucide-react"
import { db } from "@/lib/db"
import { fuelConsumption, fuelTypes, stations, oilTransactions, oils, consumers } from "@/lib/db/schema"
import { sql, eq } from "drizzle-orm"

export default async function ReportsPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === "admin"

  // Aggregate fuel consumed per type per station (all time for now, or could filter by month)
  const fuelReport = await db
    .select({
      stationName: stations.name,
      fuelTypeName: fuelTypes.name,
      // group by day so we can show a date per row
      date: sql<string>`date_trunc('day', ${fuelConsumption.date})`,
      totalQuantity: sql<number>`SUM(${fuelConsumption.quantity})`
    })
    .from(fuelConsumption)
    .innerJoin(stations, eq(fuelConsumption.stationId, stations.id))
    .innerJoin(fuelTypes, eq(fuelConsumption.fuelTypeId, fuelTypes.id))
    .groupBy(stations.name, fuelTypes.name, sql`date_trunc('day', ${fuelConsumption.date})`)

  // Aggregate oil dispensed per consumer
  const oilReport = await db
    .select({
      consumerName: consumers.name,
      oilName: oils.name,
      date: sql<string>`date_trunc('day', ${oilTransactions.date})`,
      totalQuantity: sql<number>`SUM(${oilTransactions.quantity})`
    })
    .from(oilTransactions)
    .innerJoin(consumers, eq(oilTransactions.consumerId, consumers.id))
    .innerJoin(oils, eq(oilTransactions.oilId, oils.id))
    .groupBy(consumers.name, oils.name, sql`date_trunc('day', ${oilTransactions.date})`)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="size-6" />
          </div>
          التقارير
        </h2>
        <p className="text-muted-foreground mt-2">
          تقارير إجمالية لاستهلاك الوقود والزيوت.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">استهلاك الوقود (تجميعي)</h3>
          {fuelReport.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-right">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">التاريخ</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">المحطة</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">النوع</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">إجمالي الكمية (لتر)</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {fuelReport.map((row, i) => (
                    <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-2 align-middle">{row.date ? new Date(row.date).toLocaleDateString() : "-"}</td>
                      <td className="p-2 align-middle font-medium">{row.stationName}</td>
                      <td className="p-2 align-middle">{row.fuelTypeName}</td>
                      <td className="p-2 align-middle">{row.totalQuantity?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا يوجد بيانات استهلاك للوقود.</p>
          )}
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">صرف الزيوت (تجميعي)</h3>
          {oilReport.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-right">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">التاريخ</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">الجهة</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">الصنف</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">إجمالي الكمية</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {oilReport.map((row, i) => (
                    <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-2 align-middle">{row.date ? new Date(row.date).toLocaleDateString() : "-"}</td>
                      <td className="p-2 align-middle font-medium">{row.consumerName}</td>
                      <td className="p-2 align-middle">{row.oilName}</td>
                      <td className="p-2 align-middle">{row.totalQuantity?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا يوجد بيانات صرف للزيوت.</p>
          )}
        </div>
      </div>
    </div>
  )
}
