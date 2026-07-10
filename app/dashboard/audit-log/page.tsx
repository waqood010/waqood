import { getSession } from "@/lib/session"
import { History, ShieldAlert } from "lucide-react"
import { db } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { redirect } from "next/navigation"

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  create: { label: "إضافة", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  update: { label: "تعديل", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  delete: { label: "حذف", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  login:  { label: "دخول", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  logout: { label: "خروج", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
}

const TABLE_LABELS: Record<string, string> = {
  oil_supplies:    "توريدات الزيوت",
  oil_transactions:"صرف الزيوت",
  fuel_supplies:   "توريدات الوقود",
  fuel_consumption:"صرف الوقود",
  fuel_types:      "أنواع الوقود",
  consumers:       "الجهات المستهلكة",
  oils:            "أصناف الزيوت",
  stations:        "المحطات",
  tanks:           "الخزانات",
  system_settings: "الإعدادات العامة",
  oil_consumption_rates: "معدلات الاستهلاك",
}

export default async function AuditLogPage() {
  const session = await getSession()
  if (session?.user?.role !== "admin") {
    redirect("/dashboard")
  }

  const logs = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History className="size-6" />
          </div>
          سجل العمليات
        </h2>
        <p className="text-muted-foreground mt-2 flex items-center gap-2">
          <ShieldAlert className="size-4 text-orange-500" />
          هذه الصفحة متاحة لمديري النظام فقط. تعرض أحدث 100 حركة.
        </p>
      </div>

      <div className="mt-2 border rounded-lg overflow-hidden">
        {logs.length > 0 ? (
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-right">
              <thead className="bg-secondary/50 text-muted-foreground border-b">
                <tr>
                  <th className="h-12 px-4 text-right font-medium">التاريخ والوقت</th>
                  <th className="h-12 px-4 text-right font-medium">المستخدم</th>
                  <th className="h-12 px-4 text-right font-medium">الإجراء</th>
                  <th className="h-12 px-4 text-right font-medium">الجدول / القسم</th>
                  <th className="h-12 px-4 text-right font-medium">رقم السجل</th>
                  <th className="h-12 px-4 text-right font-medium">تفاصيل (بعد)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const actionMeta = ACTION_LABELS[log.action] ?? { label: log.action, className: "bg-gray-100 text-gray-800" }
                  const tableLabel = log.tableName ? (TABLE_LABELS[log.tableName] ?? log.tableName) : "-"
                  const afterSummary = log.afterData && typeof log.afterData === "object"
                    ? Object.entries(log.afterData as Record<string, any>)
                        .filter(([k]) => !["id", "createdAt", "userId"].includes(k))
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" • ") || "-"
                    : "-"

                  return (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4 align-middle font-mono text-xs" dir="ltr">
                        {new Date(log.createdAt).toLocaleString("ar-EG")}
                      </td>
                      <td className="p-4 align-middle font-medium">{log.userName || "غير معروف"}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${actionMeta.className}`}>
                          {actionMeta.label}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">{tableLabel}</td>
                      <td className="p-4 align-middle font-mono text-xs text-muted-foreground">{log.recordId || "-"}</td>
                      <td className="p-4 align-middle text-xs text-muted-foreground max-w-xs truncate" title={afterSummary}>
                        {afterSummary}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <History className="size-12 mb-4 opacity-20" />
            <p>لا يوجد سجل عمليات متاح.</p>
            <p className="text-sm mt-1 opacity-60">ستظهر هنا جميع عمليات الإضافة والتعديل والحذف.</p>
          </div>
        )}
      </div>
    </div>
  )
}
