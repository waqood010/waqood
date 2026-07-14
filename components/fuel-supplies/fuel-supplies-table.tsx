"use client"

import { useState, useEffect } from "react"
import { FuelSupplyForm } from "./fuel-supply-form"
import { SupplyDetailsModal } from "./supply-details-modal"
import { deleteFuelSupply, getSupplyWithDistributions } from "@/app/dashboard/fuel-supplies/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Plus, Edit3, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"
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
  const formatLocalDate = (date: Date) => date.toISOString().slice(0, 10)

  const today = new Date()
  const defaultFromDate = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1))
  const defaultToDate = formatLocalDate(today)

  const [editingSupply, setEditingSupply] = useState<any>(null)
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(defaultToDate)
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const stationQuery = selectedStationId ? `&stationId=${selectedStationId}` : ""
      const res = await fetch(`/api/fuel-supplies?from=${fromDate}&to=${toDate}${stationQuery}`)
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast.error("فشل في جلب بيانات الواردات")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [fromDate, toDate, selectedStationId])

  const handleDelete = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من حذف هذا السجل؟ سيتم استرداد الكميات من الخزانات."))) return
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
        <div className="flex flex-wrap items-center gap-3">
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

        <div className="flex flex-col gap-4 w-full sm:flex-row sm:items-center sm:w-auto">
          <div className="flex items-center gap-3">
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
                <th className="px-4 py-3 font-medium">مستند</th>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">الكمية ({selectedStationId ? "المحطة" : "الإجمالية"})</th>
                <th className="px-4 py-3 font-medium">المورد / الفاتورة</th>
                <th className="px-4 py-3 font-medium">الإجمالي (ج)</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد سجلات ضمن النطاق المحدد
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => (
                  <tr
                    key={row.distributionId ?? row.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSupply({ ...row, id: row.id })}
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span>#{row.documentNumber}</span>
                        {selectedStationId && row.importNumber && (
                          <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">
                            وارد #{row.importNumber}
                          </span>
                        )}
                      </div>
                    </td>
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
                  <td colSpan={3} className="px-4 py-3 text-left">
                    الإجمالي:
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {totalQuantity.toLocaleString()}
                  </td>
                  <td></td>
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
