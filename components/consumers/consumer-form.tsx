"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createConsumer, updateConsumer } from "@/app/dashboard/consumers/actions"

const CONSUMER_TYPES = ["ورشة صيانة", "مركز خدمة", "وحدة فنية", "أخرى"]

export function ConsumerForm({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialData?: any
}) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<string>(initialData?.type || CONSUMER_TYPES[0])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const notes = formData.get("notes") as string

    try {
      if (initialData) {
        await updateConsumer(initialData.id, { name, type, notes })
        toast.success("تم تعديل الجهة بنجاح")
      } else {
        await createConsumer({ name, type, notes })
        toast.success("تم إضافة الجهة بنجاح")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{initialData ? "تعديل بيانات الجهة" : "إضافة جهة مستهلكة جديدة"}</SheetTitle>
          <SheetDescription>
            قم بتعريف الورش والمراكز التي تقوم بصرف واستلام الزيوت والشحوم.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الجهة</Label>
            <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="مثال: ورشة الإصلاح المركزية" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">نوع الجهة</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {CONSUMER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Input id="notes" name="notes" defaultValue={initialData?.notes} placeholder="أي تفاصيل إضافية..." />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {initialData ? "حفظ التعديلات" : "إضافة الجهة"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
