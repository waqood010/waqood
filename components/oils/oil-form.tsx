"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createOil, updateOil } from "@/app/dashboard/oils/actions"

const UNITS = ["عبوة", "لتر", "كيلو", "كرتونة", "برميل"]

export function OilForm({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialData?: any
}) {
  const [loading, setLoading] = useState(false)
  const [unit, setUnit] = useState<string>(initialData?.unit || UNITS[0])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const currentBalance = Number(formData.get("currentBalance")) || 0
    const minAlertLevel = Number(formData.get("minAlertLevel")) || 0
    const packsPerCarton = Number(formData.get("packsPerCarton")) || 0
    const barrelQuantity = Number(formData.get("barrelQuantity")) || 0
    const notes = formData.get("notes") as string

    try {
      if (initialData) {
        await updateOil(initialData.id, {
          name,
          currentBalance,
          unit,
          packsPerCarton,
          barrelQuantity,
          minAlertLevel,
          notes,
        })
        toast.success("تم تعديل الصنف بنجاح")
      } else {
        await createOil({
          name,
          currentBalance,
          unit,
          packsPerCarton,
          barrelQuantity,
          minAlertLevel,
          notes,
        })
        toast.success("تم إضافة الصنف بنجاح")
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
      <SheetContent side="center" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? "تعديل بيانات الصنف" : "إضافة صنف زيت/شحم جديد"}</SheetTitle>
          <SheetDescription>
            قم بتعريف الصنف ووحدة القياس الأساسية التي سيتم التعامل بها في المخزن.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الصنف</Label>
            <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="مثال: زيت محرك ديزل 50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">وحدة القياس الأساسية</Label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {unit === "كرتونة" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="packsPerCarton">عدد العبوات داخل الكرتونة</Label>
              <Input
                id="packsPerCarton"
                name="packsPerCarton"
                type="number"
                min="1"
                required
                defaultValue={initialData?.packsPerCarton || ""}
                dir="ltr"
                className="text-right"
              />
            </div>
          )}

          {unit === "برميل" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="barrelQuantity">سعة البرميل (باللتر/الكيلو)</Label>
              <Input
                id="barrelQuantity"
                name="barrelQuantity"
                type="number"
                step="0.01"
                min="0.1"
                required
                defaultValue={initialData?.barrelQuantity || ""}
                dir="ltr"
                className="text-right"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentBalance">الرصيد الحالي ({unit})</Label>
            <Input
              id="currentBalance"
              name="currentBalance"
              type="number"
              step="0.01"
              defaultValue={initialData?.currentBalance ?? 0}
              dir="ltr"
              className="text-right"
            />
            <p className="text-xs text-muted-foreground">تحديد الرصيد الحالي للصنف في المخزن</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minAlertLevel">حد التنبيه الأدنى ({unit})</Label>
            <Input
              id="minAlertLevel"
              name="minAlertLevel"
              type="number"
              step="0.01"
              defaultValue={initialData?.minAlertLevel || 0}
              dir="ltr"
              className="text-right"
            />
            <p className="text-xs text-muted-foreground">تنبيه عند انخفاض الرصيد عن هذا الحد</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Input id="notes" name="notes" defaultValue={initialData?.notes} placeholder="أي ملاحظات إضافية..." />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {initialData ? "حفظ التعديلات" : "إضافة الصنف"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
