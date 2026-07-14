"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTank, updateTank } from "@/app/dashboard/stations/actions"

export function TankForm({ 
  open, 
  onOpenChange,
  stationId,
  fuelTypes,
  initialData 
}: { 
  open: boolean
  onOpenChange: (o: boolean) => void
  stationId: number
  fuelTypes: any[]
  initialData?: any 
}) {
  const [loading, setLoading] = useState(false)
  const [selectedFuelType, setSelectedFuelType] = useState<number>(initialData?.fuelTypeId || (fuelTypes[0]?.id || 0))
  const [capacityTon, setCapacityTon] = useState<number>(initialData?.capacityTon || 0)
  const [startupBalance, setStartupBalance] = useState<number>(initialData?.startupBalance ?? initialData?.currentBalance ?? 0)

  // Compute liters immediately for UI feedback
  const fuel = fuelTypes.find(f => f.id === selectedFuelType)
  const tonToLiter = fuel?.tonToLiter || 0
  const computedLiters = capacityTon * tonToLiter

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const minAlertLevel = Number(formData.get("minAlertLevel")) || 0
    const startupBalanceValue = Number(formData.get("startupBalance")) || 0
    
    try {
      if (initialData) {
        await updateTank(initialData.id, { 
          name, 
          fuelTypeId: selectedFuelType,
          capacityTon,
          minAlertLevel,
          startupBalance: startupBalanceValue,
        })
        toast.success("تم تعديل الخزان بنجاح")
      } else {
        await createTank({ 
          name, 
          stationId,
          fuelTypeId: selectedFuelType,
          capacityTon,
          minAlertLevel,
          startupBalance: startupBalanceValue,
        })
        toast.success("تم إضافة الخزان بنجاح")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>{initialData ? "تعديل بيانات الخزان" : "إضافة خزان جديد"}</DialogTitle>
          <DialogDescription>
            سيتم احتساب السعة باللتر تلقائياً بناءً على معامل تحويل نوع الوقود المختار.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الخزان</Label>
              <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="مثال: خزان أ" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelType">نوع الوقود</Label>
              <select
                id="fuelType"
                value={selectedFuelType}
                onChange={(e) => setSelectedFuelType(Number(e.target.value))}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {fuelTypes.map(f => (
                  <option key={f.id} value={f.id}>{f.name} (المعامل: {f.tonToLiter})</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacityTon">السعة (بالطن)</Label>
                <Input 
                  id="capacityTon" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={capacityTon || ''} 
                  onChange={e => setCapacityTon(Number(e.target.value))} 
                  placeholder="0.00" 
                  dir="ltr"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label>السعة باللتر</Label>
                <div className="flex h-10 items-center rounded-lg border border-input bg-secondary/10 px-3 text-sm text-muted-foreground" dir="ltr">
                  {computedLiters.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startupBalance">الرصيد الابتدائي (باللتر)</Label>
              <Input 
                id="startupBalance" 
                name="startupBalance"
                type="number" 
                step="0.01"
                min={0}
                max={computedLiters}
                value={startupBalance || ''}
                onChange={e => setStartupBalance(Number(e.target.value))}
                dir="ltr"
                className="text-right"
              />
              <p className="text-xs text-muted-foreground">يمكنك إدخال الرصيد الموجود في الخزان عند إضافته لأول مرة.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minAlertLevel">حد التنبيه الأدنى (باللتر)</Label>
              <Input 
                id="minAlertLevel" 
                name="minAlertLevel"
                type="number" 
                defaultValue={initialData?.minAlertLevel || 0} 
                dir="ltr"
                className="text-right"
              />
              <p className="text-xs text-muted-foreground">يُصدر النظام تنبيهاً إذا انخفض الرصيد عن هذا الحد</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {initialData ? "حفظ التعديلات" : "إضافة الخزان"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
