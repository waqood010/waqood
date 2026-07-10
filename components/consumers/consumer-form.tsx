"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createConsumer, updateConsumer } from "@/app/dashboard/consumers/actions"

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const notes = formData.get("notes") as string

    try {
      if (initialData) {
        await updateConsumer(initialData.id, { name, notes })
        toast.success("تم تعديل الجهة بنجاح")
      } else {
        await createConsumer({ name, notes })
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
      <SheetContent side="center" className="w-full sm:max-w-md">
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
