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
  const [stationId, setStationId] = useState<number | null>(null)
  const [tankId, setTankId] = useState<number | null>(null)
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null)

  const [quantity, setQuantity] = useState<number>(0)
  const [unitPrice, setUnitPrice] = useState<number>(0)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!stationId || !tankId || !selectedTank) {
      toast.error("يرجى اختيار المحطة والخزان")
      return
    }

    if (quantity <= 0) {
      toast.error("الكمية يجب أن تكون أكبر من صفر")
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const invoiceNumber = formData.get("invoiceNumber") as string
    const supplierCompany = formData.get("supplierCompany") as string
    const dateStr = formData.get("date") as string

    try {
      await createFuelSupply({
        stationId,
        tankId,
        fuelTypeId: selectedTank.fuelTypeId,
        quantity,
        unitPrice,
        invoiceNumber,
        supplierCompany,
        date: new Date(dateStr),
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
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>تسجيل وارد وقود جديد</SheetTitle>
          <SheetDescription>
            سيتم إضافة الكمية المدخلة إلى الرصيد الحالي للخزان المختار.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>تاريخ التوريد</Label>
            <Input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
            />
          </div>

          <StationTankSelector
            stations={stations}
            allTanks={tanks}
            selectedStationId={stationId}
            selectedTankId={tankId}
            onStationChange={setStationId}
            onTankChange={setTankId}
            onTankDataChange={setSelectedTank}
          />

          {selectedTank && (
            <div className="rounded-md border border-border bg-secondary/20 p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">نوع الوقود:</span>
                <span className="font-medium">{selectedTank.fuelType.name}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">السعة الكلية:</span>
                <span className="font-medium" dir="ltr">{selectedTank.capacityLiter.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">الرصيد الحالي:</span>
                <span className="font-medium" dir="ltr">{selectedTank.currentBalance.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المساحة الشاغرة:</span>
                <span className="font-medium text-emerald-600" dir="ltr">
                  {(selectedTank.capacityLiter - selectedTank.currentBalance).toLocaleString()} L
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الكمية (لتر)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>سعر الوحدة (جنيه)</Label>
              <Input
                type="number"
                step="0.01"
                value={unitPrice || ""}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الإجمالي (جنيه)</Label>
            <div className="h-9 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-muted-foreground" dir="ltr">
              {(quantity * unitPrice).toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <Label>الشركة المورِّدة (اختياري)</Label>
            <Input name="supplierCompany" placeholder="مثال: شركة مصر للبترول" />
          </div>

          <div className="space-y-2">
            <Label>رقم الفاتورة (اختياري)</Label>
            <Input name="invoiceNumber" placeholder="رقم الفاتورة أو إذن التسليم" dir="ltr" className="text-right" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            تسجيل الوارد
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
