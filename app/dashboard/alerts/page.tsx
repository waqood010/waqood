import { getSession } from "@/lib/session"
import { Bell, AlertTriangle } from "lucide-react"
import { db } from "@/lib/db"
import { alerts } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

export default async function AlertsPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role === "admin"

  const allAlerts = await db.select().from(alerts).orderBy(desc(alerts.createdAt))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="size-6" />
          </div>
          التنبيهات
        </h2>
        <p className="text-muted-foreground mt-2">
          سجل تنبيهات النظام الخاصة بالأرصدة ومعدلات الاستهلاك.
        </p>
      </div>

      <div className="mt-4">
        {allAlerts.length > 0 ? (
          <div className="space-y-4">
            {allAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`flex items-start gap-4 rounded-lg border p-4 ${!alert.isRead ? 'bg-secondary/5 border-primary/20' : 'opacity-80'}`}
              >
                <div className={`mt-0.5 rounded-full p-2 ${
                  alert.level === 'critical' || alert.level === 'high' 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-500'
                }`}>
                  <AlertTriangle className="size-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-base font-medium leading-none ${!alert.isRead ? 'text-primary' : ''}`}>
                    {alert.title}
                  </p>
                  {alert.message && (
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: ar })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-secondary/10 text-muted-foreground">
            <Bell className="size-12 mb-4 opacity-20" />
            <p>لا يوجد تنبيهات مسجلة.</p>
          </div>
        )}
      </div>
    </div>
  )
}
