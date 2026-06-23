"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Fuel, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

type Mode = "sign-in" | "sign-up"

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  })

  const isSignUp = mode === "sign-up"

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          email: form.email,
          password: form.password,
          name: form.name,
          // @ts-expect-error additional field
          phone: form.phone,
        })
        if (error) {
          toast.error(error.message ?? "تعذّر إنشاء الحساب")
          return
        }
        toast.success("تم إنشاء الحساب بنجاح")
      } else {
        const { error } = await authClient.signIn.email({
          email: form.email,
          password: form.password,
        })
        if (error) {
          toast.error(error.message ?? "بيانات الدخول غير صحيحة")
          return
        }
        toast.success("تم تسجيل الدخول")
      }
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error("حدث خطأ غير متوقع")
      console.log("[v0] auth error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Fuel className="size-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground text-balance">
          نظام إدارة الوقود والزيوت
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignUp ? "أنشئ حسابًا جديدًا للوصول إلى النظام" : "سجّل الدخول للمتابعة إلى لوحة التحكم"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        {isSignUp && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={update("name")}
              placeholder="مثال: أحمد محمد"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            required
            dir="ltr"
            className="text-right"
            value={form.email}
            onChange={update("email")}
            placeholder="name@example.com"
          />
        </div>

        {isSignUp && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
            <Input
              id="phone"
              dir="ltr"
              className="text-right"
              value={form.phone}
              onChange={update("phone")}
              placeholder="01xxxxxxxxx"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={form.password}
              onChange={update("password")}
              placeholder="********"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isSignUp ? "إنشاء الحساب" : "تسجيل الدخول"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "لديك حساب بالفعل؟ " : "ليس لديك حساب؟ "}
          <a
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="font-semibold text-primary hover:underline"
          >
            {isSignUp ? "تسجيل الدخول" : "إنشاء حساب"}
          </a>
        </p>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()} — نظام إدارة الوقود والزيوت
      </p>
    </div>
  )
}
