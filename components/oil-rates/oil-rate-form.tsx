"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createOilRate, updateOilRate } from "@/app/dashboard/oil-rates/actions"

export function OilRateForm({
  open,
  onOpenChange,
  initialData,
  consumers,
  oils,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialData?: any
  consumers: any[]
  oils: any[]
}) {
  const [loading, setLoading] = useState(false)
  const [consumerId, setConsumerId] = useState<number>(initialData?.consumerId || consumers[0]?.id || 0)
  const [oilId, setOilId] = useState<number>(initialData?.oilId || oils[0]?.id || 0)
  const [period, setPeriod] = useState<string>(initialData?.period || "monthly")

  const selectedOil = oils.find(o => o.id === oilId)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const rate = Number(formData.get("rate"))

    try {
      if (initialData) {
        // Can't update consumerId/oilId in update, only rate/period
        await updateOilRate(initialData.id, { rate, period })
        toast.success("تم تعديل المعدل بنجاح")
      } else {
        await createOilRate({ consumerId, oilId, rate, period })
        toast.success("تم إضافة المعدل بنجاح")
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
          <SheetTitle>{initialData ? "تعديل معدل الاستهلاك" : "إضافة معدل استهلاك جديد"}</SheetTitle>
          <SheetDescription>
            تحديد الحصة أو المعدل المسموح به للجهة من صنف معين.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>الجهة المستهلكة</Label>
            <select
              value={consumerId}
              onChange={(e) => setConsumerId(Number(e.target.value))}
              disabled={!!initialData}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {consumers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>الصنف (الزيت / الشحم)</Label>
            <select
              value={oilId}
              onChange={(e) => setOilId(Number(e.target.value))}
              disabled={!!initialData}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {oils.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">المعدل المسموح ({selectedOil?.unit || "كمية"})</Label>
              <Input
                id="rate"
                name="rate"
                type="number"
                step="0.01"
                min="0.1"
                required
                defaultValue={initialData?.rate || ""}
                dir="ltr"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label>الفترة</Label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="monthly">شهري</option>
                <option value="weekly">أسبوعي</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {initialData ? "حفظ التعديلات" : "إضافة المعدل"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
