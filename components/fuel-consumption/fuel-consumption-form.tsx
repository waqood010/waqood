"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { StationTankSelector, type Station, type Tank } from "@/components/shared/station-tank-selector"
import { createFuelConsumption } from "@/app/dashboard/fuel-consumption/actions"
import { cn } from "@/lib/utils"

export function FuelConsumptionForm({
  open,
  onOpenChange,
  stations,
  tanks,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  stations: Station[]
  tanks: Tank[]
  onSaved?: () => void | Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [stationId, setStationId] = useState<number | null>(null)
  const [tankId, setTankId] = useState<number | null>(null)
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null)

  const [quantity, setQuantity] = useState<number>(0)
  const [includeActualReading, setIncludeActualReading] = useState(false)
  const [actualReading, setActualReading] = useState<number>(0)

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

    if (quantity > selectedTank.currentBalance) {
      toast.error(`لا يمكن صرف كمية أكبر من الرصيد الحالي (${selectedTank.currentBalance} لتر)`)
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const notes = formData.get("notes") as string
    const dateStr = formData.get("date") as string

    try {
      await createFuelConsumption({
        stationId,
        tankId,
        fuelTypeId: selectedTank.fuelTypeId,
        quantity,
        date: new Date(dateStr),
        notes,
        actualReading: includeActualReading ? actualReading : undefined,
      })
      toast.success("تم تسجيل الاستهلاك بنجاح")
      if (onSaved) {
        await onSaved()
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الحفظ")
    } finally {
      setLoading(false)
    }
  }

  const newTheoreticalBalance = selectedTank ? selectedTank.currentBalance - quantity : 0
  const readingDifference = actualReading - newTheoreticalBalance

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="center" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>تسجيل استهلاك وقود</SheetTitle>
          <SheetDescription>
            سيتم خصم الكمية المدخلة من الرصيد الحالي للخزان المختار.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>تاريخ الاستهلاك</Label>
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
                <span className="text-muted-foreground">الرصيد الحالي:</span>
                <span className="font-medium" dir="ltr">{selectedTank.currentBalance.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">حد التنبيه الأدنى:</span>
                <span className="font-medium" dir="ltr">{selectedTank.minAlertLevel.toLocaleString()} L</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>الكمية المستهلكة (لتر)</Label>
            <Input
              type="number"
              step="0.01"
              required
              value={quantity || ""}
              onChange={(e) => setQuantity(Number(e.target.value))}
              dir="ltr"
              className="text-right"
            />
            {selectedTank && quantity > 0 && (
              <p className={cn(
                "text-xs mt-1",
                newTheoreticalBalance < selectedTank.minAlertLevel ? "text-destructive font-medium" : "text-muted-foreground"
              )}>
                الرصيد بعد الخصم: {newTheoreticalBalance.toLocaleString()} لتر
                {newTheoreticalBalance < selectedTank.minAlertLevel && " (أقل من الحد الأدنى!)"}
              </p>
            )}
          </div>

          {/* Optional Actual Reading Section */}
          <div className="rounded-md border border-border p-4 bg-card space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="includeActualReading" 
                checked={includeActualReading}
                onCheckedChange={(c) => setIncludeActualReading(c as boolean)}
              />
              <Label htmlFor="includeActualReading" className="cursor-pointer font-medium">
                إضافة قراءة فعلية من المقياس (اختياري)
              </Label>
            </div>
            
            {includeActualReading && (
              <div className="space-y-4 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>القراءة الفعلية (لتر)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required={includeActualReading}
                    value={actualReading || ""}
                    onChange={(e) => setActualReading(Number(e.target.value))}
                    dir="ltr"
                    className="text-right"
                  />
                </div>

                <div className="bg-secondary/50 p-3 rounded-md text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرصيد النظري:</span>
                    <span dir="ltr">{newTheoreticalBalance.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-2 font-medium">
                    <span className="text-muted-foreground">الفرق:</span>
                    <span dir="ltr" className={cn(
                      readingDifference === 0 ? "text-emerald-600" : 
                      Math.abs(readingDifference) <= 100 ? "text-yellow-600" : "text-destructive"
                    )}>
                      {readingDifference > 0 ? "+" : ""}{readingDifference.toLocaleString()} L
                    </span>
                  </div>
                  <div className="text-xs text-center mt-2">
                    {readingDifference === 0 && <span className="text-emerald-600">مطابق تماماً ✅</span>}
                    {Math.abs(readingDifference) > 0 && Math.abs(readingDifference) <= 100 && <span className="text-yellow-600">فرق مقبول ضمن المسموح ⚠️</span>}
                    {Math.abs(readingDifference) > 100 && <span className="text-destructive">يوجد عجز/زيادة غير طبيعية 🔴</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Input name="notes" placeholder="أي تفاصيل إضافية..." />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            تسجيل الاستهلاك
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
