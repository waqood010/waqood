import { getSession, isAdminRole, isSuperAdminRole } from "@/lib/session"
import { Settings, ShieldAlert, Flame } from "lucide-react"
import { db } from "@/lib/db"
import { desc } from "drizzle-orm"
import { fuelTypes, systemSettings, user } from "@/lib/db/schema"
import { redirect } from "next/navigation"
import { FuelTypesTable } from "@/components/settings/fuel-types-table"
import { UsersTable } from "@/components/settings/users-table"
import { ChangePasswordForm } from "@/components/settings/change-password-form"
import { formatArabicDate } from "@/lib/date"

export default async function SettingsPage() {
  const session = await getSession()
  const role = session?.user?.role || "user"
  if (!isAdminRole(role)) {
    redirect("/dashboard")
  }

  const canCreateUsers = isAdminRole(role)
  const isSuperAdmin = isSuperAdminRole(role)
  const allFuelTypes = await db.select().from(fuelTypes)
  const settings = await db.select().from(systemSettings)
  const users = await db.select().from(user).orderBy(desc(user.createdAt))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="size-6" />
          </div>
          إعدادات النظام
        </h2>
        <p className="text-muted-foreground mt-2 flex items-center gap-2">
          <ShieldAlert className="size-4 text-orange-500" />
          هذه الصفحة متاحة لمديري النظام فقط. لإدارة أنواع الوقود وإعدادات التطبيق.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fuel Types Section */}
        <div className="border rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2 border-b pb-3 mb-4">
            <Flame className="size-5 text-orange-500" />
            إدارة أنواع الوقود
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            تحديد أنواع الوقود المتاحة بالنظام ومعاملات التحويل بين الطن واللتر وحدود التنبيه.
          </p>
          <FuelTypesTable initialData={allFuelTypes} />
        </div>

        {/* User Management Section */}
        <div className="border rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2 border-b pb-3 mb-4">
            <Settings className="size-5 text-primary" />
            إدارة المستخدمين
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            أضف مستخدمين جدد بصلاحية مدير نظام أو مستخدم عادي.
          </p>
          <UsersTable initialData={users} canCreate={canCreateUsers} isSuperAdmin={isSuperAdmin} />
        </div>

        {/* Change Password Section */}
        <div className="border rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2 border-b pb-3 mb-4">
            <Settings className="size-5 text-primary" />
            تغيير كلمة المرور
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            يمكنك تغيير كلمة المرور الخاصة بحسابك الحالي.
          </p>
          <ChangePasswordForm />
        </div>

        {/* System Settings Section */}
        {/* <div className="border rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2 border-b pb-3 mb-4">
            <Settings className="size-5 text-primary" />
            الإعدادات العامة
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            إعدادات النظام الأخرى كحدود التنبيه الافتراضية وخيارات العرض.
          </p>
          {settings.length > 0 ? (
            <div className="relative w-full overflow-auto border rounded-md">
              <table className="w-full caption-bottom text-sm text-right">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="h-10 px-4 font-medium text-muted-foreground">المفتاح</th>
                    <th className="h-10 px-4 font-medium text-muted-foreground">القيمة</th>
                    <th className="h-10 px-4 font-medium text-muted-foreground">الوصف</th>
                    <th className="h-10 px-4 font-medium text-muted-foreground">آخر تحديث</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {settings.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-mono text-xs">{s.settingKey}</td>
                      <td className="p-4 font-semibold">{s.settingValue || "-"}</td>
                      <td className="p-4 text-muted-foreground">{s.description || "-"}</td>
                      <td className="p-4 text-muted-foreground text-xs" dir="ltr">
                        {formatArabicDate(s.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-secondary/10 text-muted-foreground">
              <Settings className="size-10 mb-2 opacity-20" />
              <p>لا توجد إعدادات عامة محددة بعد.</p>
            </div>
          )}
        </div> */}
      </div>
    </div>
  )
}
