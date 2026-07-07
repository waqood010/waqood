"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StationTankSelector, type Station, type Tank } from "@/components/shared/station-tank-selector"
import { createFuelSupply } from "@/app/dashboard/fuel-supplies/actions"

export function FuelSupplyForm({
  open,
  onOpenChange,
  stations,
  tanks,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  stations: Station[]
  tanks: Tank[]
}) {
  const [loading, setLoading] = useState(false)
  const [totalQuantity, setTotalQuantity] = useState<number>(0)
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [distributions, setDistributions] = useState<Array<any>>([
    { stationId: null, tankId: null, quantity: 0, importNumber: 1 },
  ])

  function updateDistribution(index: number, patch: Partial<any>) {
    setDistributions((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...patch }
      return copy
    })
  }

  function addRow() {
    setDistributions((p) => [...p, { stationId: null, tankId: null, quantity: 0, importNumber: 1 }])
  }

  function removeRow(idx: number) {
    setDistributions((p) => p.filter((_, i) => i !== idx))
  }

  async function autofillImportNumber(idx: number) {
    const stationId = distributions[idx].stationId
    if (!stationId) return toast.error("اختر المحطة أولاً")
    try {
      const res = await fetch(`/api/fuel-supplies/next-import-number?stationId=${stationId}`)
      const json = await res.json()
      if (json.next) updateDistribution(idx, { importNumber: json.next })
    } catch (err: any) {
      toast.error("فشل في جلب رقم التوريدة التالي")
    }
  }

  const sumDistributed = distributions.reduce((s, d) => s + (Number(d.quantity) || 0), 0)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const invoiceNumber = formData.get("invoiceNumber") as string
    const supplierCompany = formData.get("supplierCompany") as string
    const dateStr = formData.get("date") as string

    // Basic validations
    if (!totalQuantity || totalQuantity <= 0) return toast.error("ادخل الكمية الإجمالية")
    if (sumDistributed !== totalQuantity) return toast.error("مجموع الكميات الموزعة يجب أن يساوي الكمية الإجمالية")
    if (distributions.some(d => !d.stationId || !d.tankId || !d.quantity)) return toast.error("تأكد من اكتمال بيانات جميع الصفوف")

    setLoading(true)
    try {
      await createFuelSupply({
        fuelTypeId: Number(distributions[0]?.fuelTypeId) || undefined,
        totalQuantity,
        unitPrice,
        invoiceNumber,
        supplierCompany,
        date: new Date(dateStr),
        distributions: distributions.map((d) => ({
          stationId: Number(d.stationId),
          tankId: Number(d.tankId),
          quantity: Number(d.quantity),
          importNumber: Number(d.importNumber) || 1,
        })),
      })
      toast.success("تم تسجيل الوارد بنجاح")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الحفظ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="center" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>تسجيل وارد وقود جديد</SheetTitle>
          <SheetDescription>
            وزع هذه الكمية على محطات متعددة. مجموع الكميات يجب أن يساوي الكمية الإجمالية.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-6 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ التوريد</Label>
              <Input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </div>

            <div className="space-y-2">
              <Label>سعر الوحدة (جنيه)</Label>
              <Input type="number" step="0.01" value={unitPrice || ""} onChange={(e) => setUnitPrice(Number(e.target.value))} dir="ltr" className="text-right" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الكمية الإجمالية (لتر)</Label>
              <Input type="number" step="0.01" required value={totalQuantity || ""} onChange={(e) => setTotalQuantity(Number(e.target.value))} dir="ltr" className="text-right" />
            </div>

            <div className="space-y-2">
              <Label>الإجمالي (جنيه)</Label>
              <div className="h-9 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-muted-foreground" dir="ltr">
                {(totalQuantity * unitPrice).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">التوزيع على المحطات</h4>
              <div className="text-sm text-muted-foreground">مجموع الموزع: {sumDistributed.toLocaleString()}</div>
            </div>

            <div className="space-y-2">
              {distributions.map((d, idx) => (
                <div key={idx} className="rounded-md border border-border p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <StationTankSelector
                        stations={stations}
                        allTanks={tanks}
                        selectedStationId={d.stationId}
                        selectedTankId={d.tankId}
                        onStationChange={(id) => updateDistribution(idx, { stationId: id })}
                        onTankChange={(id) => updateDistribution(idx, { tankId: id })}
                        onTankDataChange={(tank) => updateDistribution(idx, { fuelTypeId: tank?.fuelTypeId })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>الكمية (لتر)</Label>
                      <Input type="number" step="0.01" value={d.quantity || ""} onChange={(e) => updateDistribution(idx, { quantity: Number(e.target.value) })} dir="ltr" className="text-right" />
                    </div>

                    <div className="space-y-2">
                      <Label>رقم التوريدة</Label>
                      <div className="flex gap-2">
                        <Input type="number" value={d.importNumber || ""} onChange={(e) => updateDistribution(idx, { importNumber: Number(e.target.value) })} dir="ltr" className="text-right" />
                        <Button type="button" variant="outline" onClick={() => autofillImportNumber(idx)}>Auto</Button>
                        <Button type="button" variant="ghost" onClick={() => removeRow(idx)}>حذف</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <Button type="button" onClick={addRow}>إضافة محطة</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الشركة المورِّدة (اختياري)</Label>
              <Input name="supplierCompany" placeholder="مثال: شركة مصر للبترول" />
            </div>

            <div className="space-y-2">
              <Label>رقم الفاتورة (اختياري)</Label>
              <Input name="invoiceNumber" placeholder="رقم الفاتورة أو إذن التسليم" dir="ltr" className="text-right" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="ml-auto" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              تسجيل الوارد
            </Button>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
