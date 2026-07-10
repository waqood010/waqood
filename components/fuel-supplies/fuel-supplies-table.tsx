"use client"

import { useState, useEffect } from "react"
import { FuelSupplyForm } from "./fuel-supply-form"
import { SupplyDetailsModal } from "./supply-details-modal"
import { deleteFuelSupply, getSupplyWithDistributions } from "@/app/dashboard/fuel-supplies/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Plus, ChevronLeft, ChevronRight, Edit3 } from "lucide-react"
import { toast } from "sonner"
import type { Station, Tank } from "@/components/shared/station-tank-selector"

export function FuelSuppliesTable({
  initialData,
  stations,
  tanks,
  isAdmin,
}: {
  initialData: any[]
  stations: Station[]
  tanks: Tank[]
  isAdmin: boolean
}) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [selectedSupply, setSelectedSupply] = useState<any>(null)
  const [editingSupply, setEditingSupply] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null)

  const loadData = async () => {
    try {
      const y = currentMonth.getFullYear()
      const m = String(currentMonth.getMonth() + 1).padStart(2, "0")
      const stationQuery = selectedStationId ? `&stationId=${selectedStationId}` : ""
      const res = await fetch(`/api/fuel-supplies?month=${y}-${m}${stationQuery}`)
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast.error("فشل في جلب بيانات الواردات")
    }
  }

  useEffect(() => {
    loadData()
  }, [currentMonth, selectedStationId])

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟ سيتم استرداد الكميات من الخزانات.")) return
    try {
      await deleteFuelSupply(id, isAdmin ? "admin" : "user")
      setData(data.filter((d) => d.id !== id))
      toast.success("تم حذف السجل واسترجاع الكميات")
    } catch (err: any) {
      toast.error(err.message || "فشل في حذف السجل")
    }
  }

  const handleEdit = async (id: number) => {
    try {
      const supply = await getSupplyWithDistributions(id)
      setEditingSupply(supply)
      setFormOpen(true)
    } catch (err: any) {
      toast.error(err.message || "فشل في جلب بيانات التعديل")
    }
  }

  const handleSaved = async () => {
    setFormOpen(false)
    setEditingSupply(null)
    await loadData()
  }

  const filteredData = data.filter((d) =>
    d.fuelType.name.includes(search) ||
    d.supplierCompany?.includes(search) ||
    d.invoiceNumber?.includes(search) ||
    (d.documentNumber ? d.documentNumber.toString().includes(search) : false)
  )

  const sortedData = [...filteredData].sort((a, b) => (a.documentNumber ?? 0) - (b.documentNumber ?? 0))

  const totalQuantity = sortedData.reduce((sum, d) => sum + d.totalQuantity, 0)
  const totalPrice = sortedData.reduce((sum, d) => sum + d.totalPrice, 0)

  const monthLabel = currentMonth.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
  })

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronRight className="size-4" />
          </Button>
          <div className="w-40 text-center">
            <div className="text-sm font-semibold">{monthLabel}</div>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-4 w-full sm:flex-row sm:items-center sm:w-auto">
          <div className="flex items-center gap-3">
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedStationId ?? ""}
              onChange={(e) => setSelectedStationId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">جميع المحطات</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 sm:flex-none sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="بحث (مورد، فاتورة)..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isAdmin && (
            <Button onClick={() => {
              setEditingSupply(null)
              setFormOpen(true)
            }}>
              <Plus className="ml-2 size-4" /> وارد جديد
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">مستند</th>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">الكمية ({selectedStationId ? "المحطة" : "الإجمالية"})</th>
                {selectedStationId && <th className="px-4 py-3 font-medium">رقم التوريدة</th>}
                <th className="px-4 py-3 font-medium">المورد / الفاتورة</th>
                <th className="px-4 py-3 font-medium">الإجمالي (ج)</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? (selectedStationId ? 8 : 7) : (selectedStationId ? 7 : 6)} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد سجلات لهذا الشهر
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => (
                  <tr
                    key={row.distributionId ?? row.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSupply({ ...row, id: row.id })}
                  >
                    <td className="px-4 py-3 font-medium">#{row.documentNumber}</td>
                    <td className="px-4 py-3" dir="ltr">
                      {new Date(row.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {row.fuelType.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium" dir="ltr">
                      {row.totalQuantity.toLocaleString()}
                    </td>
                    {selectedStationId && (
                      <td className="px-4 py-3 font-semibold">
                        <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                          #{row.importNumber}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {row.supplierCompany || "-"}
                      <br />
                      {row.invoiceNumber ? `ف: ${row.invoiceNumber}` : ""}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {row.totalPrice.toLocaleString()}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="hover:bg-secondary/10 size-8"
                            onClick={() => handleEdit(row.id)}
                          >
                            <Edit3 className="size-4" />
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
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-secondary/50 border-t border-border font-medium">
                <tr>
                  <td colSpan={selectedStationId ? (isAdmin ? 5 : 4) : (isAdmin ? 4 : 3)} className="px-4 py-3 text-left">
                    الإجمالي:
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {totalQuantity.toLocaleString()}
                  </td>
                  {selectedStationId && <td></td>}
                  <td className="px-4 py-3" dir="ltr">
                    {totalPrice.toLocaleString()}
                  </td>
                  {isAdmin && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {formOpen && (
        <FuelSupplyForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) setEditingSupply(null)
          }}
          stations={stations}
          tanks={tanks}
          initialData={editingSupply}
          onSaved={handleSaved}
        />
      )}

      {selectedSupply && (
        <SupplyDetailsModal
          supply={selectedSupply}
          open={!!selectedSupply}
          onOpenChange={(open) => !open && setSelectedSupply(null)}
        />
      )}
    </div>
  )
}
