import { getSession, isAdminRole } from "@/lib/session"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Flame, Droplets, Building2, AlertTriangle, Clock } from "lucide-react"
import { db } from "@/lib/db"
import { tanks, oils, stations, alerts, fuelSupplies, fuelSupplyDistributions, fuelTypes } from "@/lib/db/schema"
import { sql, eq, desc } from "drizzle-orm"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

export default async function DashboardPage() {
  const session = await getSession()
  const role = session?.user?.role || "user"
  const isAdmin = isAdminRole(role)

  // Fetch live metrics
  const [
    fuelResult,
    oilResult,
    stationsResult,
    alertsResult,
    latestAlerts,
    latestOperations
  ] = await Promise.all([
    db.select({ total: sql<number>`sum(${tanks.currentBalance})` }).from(tanks),
    db.select({ total: sql<number>`sum(${oils.currentBalance})` }).from(oils),
    db.select({ count: sql<number>`count(*)` }).from(stations),
    db.select({ count: sql<number>`count(*)` }).from(alerts).where(eq(alerts.isRead, false)),
    db.select().from(alerts).where(eq(alerts.isRead, false)).orderBy(desc(alerts.createdAt)).limit(5),
    isAdmin ? db.select({
      id: fuelSupplies.id,
      date: fuelSupplies.date,
      quantity: fuelSupplyDistributions.quantity,
      stationName: stations.name,
      fuelTypeName: fuelTypes.name,
    }).from(fuelSupplyDistributions)
      .leftJoin(fuelSupplies, eq(fuelSupplyDistributions.supplyId, fuelSupplies.id))
      .leftJoin(stations, eq(fuelSupplyDistributions.stationId, stations.id))
      .leftJoin(fuelTypes, eq(fuelSupplies.fuelTypeId, fuelTypes.id))
      .orderBy(desc(fuelSupplies.createdAt))
      .limit(5) : Promise.resolve([])
  ])

  const totalFuel = fuelResult[0]?.total || 0
  const totalOil = oilResult[0]?.total || 0
  const totalStations = stationsResult[0]?.count || 0
  const activeAlertsCount = alertsResult[0]?.count || 0

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">نظرة عامة</h2>
        <p className="text-muted-foreground">
          ملخص لبيانات الوقود والزيوت وحالة المحطات والتنبيهات.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الوقود المتاح"
          value={`${totalFuel.toLocaleString()} لتر`}
          icon={Flame}
          description="مجموع الرصيد الحالي بجميع الخزانات"
          iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-500"
        />
        <StatCard
          title="إجمالي مخزون الزيوت"
          value={`${totalOil.toLocaleString()} وحدة`}
          icon={Droplets}
          description="جميع أصناف الزيوت المتاحة"
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-500"
        />
        <StatCard
          title="عدد المحطات"
          value={`${totalStations} محطة`}
          icon={Building2}
        />
        <StatCard
          title="التنبيهات النشطة"
          value={`${activeAlertsCount} تنبيه`}
          icon={AlertTriangle}
          description={activeAlertsCount > 0 ? "يوجد تنبيهات غير مقروءة" : "لا يوجد تنبيهات"}
          iconClassName={activeAlertsCount > 0 ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-500"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>معدلات الاستهلاك الشهري</CardTitle>
            <CardDescription>مقارنة بين استهلاك الوقود والزيوت خلال العام الحالي</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-secondary/10 rounded-md mx-6 mb-6 border border-dashed">
            <span className="text-muted-foreground">رسم بياني للاستهلاك</span>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>أحدث التنبيهات</CardTitle>
            <CardDescription>الخزانات والأصناف التي تتطلب انتباه</CardDescription>
          </CardHeader>
          <CardContent>
            {latestAlerts.length > 0 ? (
              <div className="space-y-4">
                {latestAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 rounded-lg border p-3">
                    <div className="mt-0.5 rounded-full bg-destructive/10 p-1.5">
                      <AlertTriangle className="size-4 text-destructive" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title}</p>
                      {alert.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{alert.message}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: ar })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <AlertTriangle className="size-8 mb-2 opacity-20" />
                <p>لا يوجد تنبيهات نشطة حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>أحدث عمليات وارد الوقود</CardTitle>
            <CardDescription>سجل أحدث حركات التوريد للمحطات</CardDescription>
          </CardHeader>
          <CardContent>
            {latestOperations.length > 0 ? (
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm text-right">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">التاريخ</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">المحطة</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">النوع</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">الكمية</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {latestOperations.map((op) => (
                        <tr key={op.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle">
                              {op.date ? new Date(op.date).toLocaleDateString("ar-EG") : ""}
                          </td>
                          <td className="p-4 align-middle font-medium">{op.stationName}</td>
                          <td className="p-4 align-middle">{op.fuelTypeName}</td>
                          <td className="p-4 align-middle">{(op.quantity ?? 0).toLocaleString()} لتر</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center bg-secondary/10 rounded-md border border-dashed text-muted-foreground">
                <Clock className="size-8 mb-2 opacity-20" />
                <p>لا توجد عمليات توريد مسجلة بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
