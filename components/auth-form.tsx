"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Fuel, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export function AuthForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    username: "",
    password: "",
  })

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await authClient.signIn.username({
        username: form.username,
        password: form.password,
      })
      if (error) {
        toast.error(error.message ?? "بيانات الدخول غير صحيحة")
        return
      }
      toast.success("تم تسجيل الدخول بنجاح")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error("حدث خطأ غير متوقع")
      console.error("[v0] auth error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
          <ShieldCheck className="size-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground text-balance">
          جهاز النقل — إدارة الوقود والزيوت
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          الرجاء إدخال اسم المستخدم وكلمة المرور للوصول إلى النظام
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-border/50 bg-card p-8 shadow-lg shadow-black/5"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">اسم المستخدم</Label>
          <Input
            id="username"
            type="text"
            required
            dir="ltr"
            className="text-right bg-secondary/50 focus-visible:bg-background h-11"
            value={form.username}
            onChange={update("username")}
            placeholder="أدخل اسم المستخدم"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              className="bg-secondary/50 focus-visible:bg-background h-11"
              value={form.password}
              onChange={update("password")}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-4 h-11 w-full text-base font-semibold" disabled={loading}>
          {loading && <Loader2 className="mr-2 size-5 animate-spin" />}
          تسجيل الدخول
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()} — جهاز النقل
      </p>
    </div>
  )
}
