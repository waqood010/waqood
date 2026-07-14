"use client"

import { useEffect, useState } from "react"
import { getStationTanks, deleteTank } from "@/app/dashboard/stations/actions"
import { TankForm } from "./tank-form"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Loader2, Droplet } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"
import { cn } from "@/lib/utils"

export function TanksSection({ stationId, fuelTypes, isAdmin }: { stationId: number, fuelTypes: any[], isAdmin: boolean }) {
  const [tanks, setTanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTank, setEditingTank] = useState<any>(null)

  const loadTanks = async () => {
    try {
      setLoading(true)
      const data = await getStationTanks(stationId)
      setTanks(data)
    } catch (err) {
      toast.error("فشل في جلب الخزانات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTanks()
  }, [stationId])

  // Reload when form closes (if successfully saved)
  const handleFormChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setTimeout(loadTanks, 500) // slight delay to allow revalidation to settle
    }
  }

  const handleDelete = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من حذف هذا الخزان؟"))) return
    try {
      await deleteTank(id)
      toast.success("تم حذف الخزان")
      loadTanks()
    } catch (err: any) {
      toast.error(err.message || "فشل في حذف الخزان")
    }
  }

  return (
    <div className="bg-secondary/20 p-4 rounded-md border border-border mt-2 mb-4 ml-8 mr-2 shadow-inner">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
          <Droplet className="size-4" />
          خزانات المحطة ({tanks.length})
        </h4>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => { setEditingTank(null); setFormOpen(true) }}>
            <Plus className="size-4 ml-1" /> إضافة خزان
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground size-5" /></div>
      ) : tanks.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground bg-background rounded-md border border-dashed">
          لا يوجد خزانات مسجلة لهذه المحطة
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tanks.map((tank) => {
            const fillPercentage = tank.capacityLiter > 0 ? (tank.currentBalance / tank.capacityLiter) * 100 : 0
            const isLow = tank.currentBalance <= tank.minAlertLevel

            return (
              <div key={tank.id} className="bg-background rounded-md border border-border p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-sm">{tank.name}</h5>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block mt-1">
                      {tank.fuelType.name}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={() => { setEditingTank(tank); setFormOpen(true) }}>
                        <Edit className="size-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(tank.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                  <span>السعة: {tank.capacityTon} طن ({tank.capacityLiter.toLocaleString()} لتر)</span>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>الرصيد</span>
                    <span className={cn(isLow ? "text-destructive" : "")}>
                      {tank.currentBalance.toLocaleString()} لتر
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", isLow ? "bg-destructive" : "bg-emerald-500")}
                      style={{ width: `${Math.min(100, Math.max(0, fillPercentage))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium mt-2 pt-1 border-t border-border">
                    <span>الفارغ</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {(tank.capacityLiter - tank.currentBalance).toLocaleString()} لتر
                    </span>
                  </div>
                  {isLow && <div className="text-[10px] text-destructive">تنبيه: الرصيد أقل من الحد الأدنى ({tank.minAlertLevel})</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <TankForm 
          open={formOpen} 
          onOpenChange={handleFormChange} 
          stationId={stationId} 
          fuelTypes={fuelTypes}
          initialData={editingTank} 
        />
      )}
    </div>
  )
}
