"use client"

import { useState } from "react"
import { createUser } from "@/app/dashboard/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatArabicDate } from "@/lib/date"

export function UsersTable({ initialData, canCreate, isSuperAdmin }: { initialData: any[]; canCreate: boolean; isSuperAdmin?: boolean }) {
  const [users, setUsers] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "user">("user")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim() || !username.trim() || !password) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setLoading(true)
    try {
      const roleToCreate = isSuperAdmin ? role : "user"
      const newUser = await createUser({ name: name.trim(), username: username.trim(), password, role: roleToCreate })
      setUsers((prev) => [newUser, ...prev])
      setName("")
      setUsername("")
      setPassword("")
      setRole("user")
      toast.success("تم إضافة المستخدم بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في إنشاء المستخدم")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">الاسم</Label>
                <Input
                  id="user-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-username">اسم المستخدم</Label>
                <Input
                  id="user-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">كلمة المرور</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {isSuperAdmin ? (
                <div className="space-y-2">
                  <Label htmlFor="user-role">الدور</Label>
                  <select
                    id="user-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "admin" | "user")}
                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="user">مستخدم عادي</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>الدور</Label>
                  <div className="text-sm text-muted-foreground">سيتم إنشاء مستخدم عادي</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "جاري الإضافة..." : "إضافة مستخدم"}
              </Button>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            سيتم إنشاء بريد إلكتروني تلقائياً باسم المستخدم متبوعاً بـ <code>@transport.gov.eg</code> لاستخدام النظام.
          </p>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="min-w-full text-sm text-right">
          <thead className="bg-secondary/50 text-muted-foreground border-b">
            <tr>
              <th className="h-12 px-4 font-medium">الاسم</th>
              <th className="h-12 px-4 font-medium">اسم المستخدم</th>
              <th className="h-12 px-4 font-medium">الدور</th>
              <th className="h-12 px-4 font-medium">البريد الإلكتروني</th>
              <th className="h-12 px-4 font-medium">تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  لا يوجد مستخدمين مسجلين بعد.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-semibold">{user.name}</td>
                  <td className="px-4 py-3">{user.username || "-"}</td>
                  <td className="px-4 py-3">
                    {user.role === "superadmin"
                      ? "مشرف أعلى"
                      : user.role === "admin"
                      ? "مدير نظام"
                      : "مستخدم"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                  <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                    {formatArabicDate(user.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!canCreate && (
        <div className="rounded-lg border border-border bg-secondary/10 p-4 text-sm text-muted-foreground">
          فقط مدير النظام الأعلى يمكنه إضافة مستخدمين جدد.
        </div>
      )}
    </div>
  )
}
