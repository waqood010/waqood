"use client"

import { useState } from "react"
import { createFuelType, updateFuelType } from "@/app/dashboard/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export function FuelTypeForm({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
}) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      tonToLiter: Number(formData.get("tonToLiter")),
      minAlertLevel: Number(formData.get("minAlertLevel")),
      criticalAlertPercent: Number(formData.get("criticalAlertPercent") || 10),
    }

    try {
      if (initialData) {
        await updateFuelType(initialData.id, data)
        toast.success("تم تعديل نوع الوقود بنجاح")
      } else {
        await createFuelType(data)
        toast.success("تم إضافة نوع الوقود بنجاح")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الحفظ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "تعديل نوع وقود" : "إضافة نوع وقود جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم نوع الوقود</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initialData?.name || ""}
              placeholder="مثال: بنزين 95"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tonToLiter">معامل التحويل (لتر/طن)</Label>
              <Input
                id="tonToLiter"
                name="tonToLiter"
                type="number"
                required
                defaultValue={initialData?.tonToLiter ?? 1200}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minAlertLevel">حد التنبيه الأدنى (لتر)</Label>
              <Input
                id="minAlertLevel"
                name="minAlertLevel"
                type="number"
                required
                defaultValue={initialData?.minAlertLevel ?? 5000}
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="criticalAlertPercent">نسبة التنبيه الحرج (%)</Label>
            <Input
              id="criticalAlertPercent"
              name="criticalAlertPercent"
              type="number"
              required
              defaultValue={initialData?.criticalAlertPercent ?? 10}
              dir="ltr"
              className="text-right"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ نوع الوقود"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
