"use client"

import { useState, useEffect } from "react"
import { FuelConsumptionForm } from "./fuel-consumption-form"
import { deleteFuelConsumption, getFuelConsumptions, getStationsWithTanks } from "@/app/dashboard/fuel-consumption/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Plus, Loader2, Edit2 } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"
import type { Station, Tank } from "@/components/shared/station-tank-selector"

export function FuelConsumptionTable({
  initialData,
  stations,
  tanks,
  isAdmin,
  defaultFrom,
  defaultTo,
}: {
  initialData: any[]
  stations: Station[]
  tanks: Tank[]
  isAdmin: boolean
  defaultFrom: string
  defaultTo: string
}) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null)
  const [avgType, setAvgType] = useState<"daily" | "weekly" | "monthly">("daily")
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [currentTanks, setCurrentTanks] = useState<Tank[]>(tanks)
  const [editing, setEditing] = useState<any | null>(null)

  useEffect(() => {
    setCurrentTanks(tanks)
  }, [tanks])

  const parseLocalDate = (dateStr: string, endOfDay = false) => {
    if (!dateStr) return undefined
    const [year, month, day] = dateStr.split("-").map(Number)
    if (endOfDay) {
      return new Date(year, month - 1, day, 23, 59, 59, 999)
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const from = parseLocalDate(fromDate)
      const to = parseLocalDate(toDate, true)
      const res = await getFuelConsumptions({
        stationId: selectedStationId || undefined,
        from,
        to,
      })
      setData(res)
    } catch (err: any) {
      toast.error("فشل في جلب البيانات")
    } finally {
      setIsLoading(false)
    }
  }

  const loadStationsAndTanks = async () => {
    try {
      const result = await getStationsWithTanks()
      setCurrentTanks(result.tanks)
    } catch (err: any) {
      toast.error("فشل في تحديث بيانات الخزانات")
    }
  }

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      return
    }
    loadData()
  }, [selectedStationId, fromDate, toDate])

  const handleSave = async () => {
    await loadData()
    await loadStationsAndTanks()
  }

  const handleDelete = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من حذف هذا السجل؟ سيتم إرجاع الكمية إلى الخزان ولن يتم حذف سجل القياس الفعلي إن وُجد."))) return
    try {
      await deleteFuelConsumption(id, isAdmin ? "admin" : "user")
      setData(data.filter((d) => d.id !== id))
      await loadStationsAndTanks()
      toast.success("تم حذف السجل واسترداد الكمية")
    } catch (err: any) {
      toast.error(err.message || "فشل في حذف السجل")
    }
  }

  const filteredData = data.filter((d) =>
    d.station.name.includes(search) ||
    d.tank.name.includes(search) ||
    d.fuelType.name.includes(search) ||
    d.notes?.includes(search)
  )

  const totalQuantity = filteredData.reduce((sum, d) => sum + d.quantity, 0)

  const fromLocal = parseLocalDate(fromDate) || new Date()
  const toLocal = parseLocalDate(toDate, true) || new Date()
  const diffTime = Math.abs(toLocal.getTime() - fromLocal.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1

  const tankTotals = filteredData.reduce((acc, d) => {
    acc[d.tank.id] = (acc[d.tank.id] || 0) + d.quantity
    return acc
  }, {} as Record<number, number>)

  const getAvgText = (totalForTank: number) => {
    const dailyAvg = totalForTank / diffDays
    if (avgType === "daily") {
      return `${dailyAvg.toLocaleString(undefined, { maximumFractionDigits: 1 })} لتر/يوم`
    } else if (avgType === "weekly") {
      return `${(dailyAvg * 7).toLocaleString(undefined, { maximumFractionDigits: 1 })} لتر/أسبوع`
    } else {
      return `${(dailyAvg * 30).toLocaleString(undefined, { maximumFractionDigits: 1 })} لتر/شهر`
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-end sm:items-center">
        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">من:</span>
            <Input
              type="date"
              className="h-9 w-36 px-2 text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">إلى:</span>
            <Input
              type="date"
              className="h-9 w-36 px-2 text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedStationId ?? ""}
            onChange={(e) => setSelectedStationId(e.target.value ? Number(e.target.value) : null)}
            disabled={isLoading}
          >
            <option value="">جميع المحطات</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>

          <div className="relative flex-1 sm:flex-none sm:min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="بحث (خزان، ملاحظات)..."
              className="pr-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Button onClick={() => setFormOpen(true)} className="h-9 shrink-0">
            <Plus className="ml-2 size-4" /> تسجيل استهلاك جديد
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity">
            <div className="flex items-center gap-2.5 bg-card border border-border px-4 py-2.5 rounded-lg shadow-lg">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-sm font-medium">جاري تحميل البيانات...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">المحطة / الخزان</th>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">الكمية المستهلكة (لتر)</th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1.5 justify-start">
                    <span>معدل الاستهلاك</span>
                    <select
                      className="text-xs bg-secondary border border-border rounded px-1.5 py-0.5 focus:outline-none cursor-pointer text-muted-foreground font-normal"
                      value={avgType}
                      onChange={(e) => setAvgType(e.target.value as "daily" | "weekly" | "monthly")}
                      disabled={isLoading}
                    >
                      <option value="daily">يومي</option>
                      <option value="weekly">أسبوعي</option>
                      <option value="monthly">شهري</option>
                    </select>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد سجلات مطابقة
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const totalForTank = tankTotals[row.tank.id] || 0
                  return (
                    <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3" dir="ltr">{new Date(row.date).toLocaleDateString("en-GB")}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{row.station.name}</span>
                          <span className="text-xs text-muted-foreground">{row.tank.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          {row.fuelType.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-destructive" dir="ltr">
                        - {row.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
                        {getAvgText(totalForTank)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {row.notes || "-"}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-left">
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-primary/10 size-8"
                              onClick={() => { setEditing(row); setFormOpen(true) }}
                            >
                              <Edit2 className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-destructive/10 hover:text-destructive size-8"
                              onClick={() => handleDelete(row.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-secondary/50 border-t border-border font-medium">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-left">الإجمالي:</td>
                  <td className="px-4 py-3 text-destructive" dir="ltr">- {totalQuantity.toLocaleString()}</td>
                  <td></td>
                  <td></td>
                  {isAdmin && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {formOpen && (
        <FuelConsumptionForm
          open={formOpen}
          onOpenChange={(v) => {
            setFormOpen(v)
            if (!v) setEditing(null)
          }}
          stations={stations}
          tanks={currentTanks}
          initialData={editing ?? undefined}
          onSaved={handleSave}
        />
      )}
    </div>
  )
}
