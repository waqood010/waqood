"use client"

import { useState } from "react"
import { FuelConsumptionForm } from "./fuel-consumption-form"
import { deleteFuelConsumption } from "@/app/dashboard/fuel-consumption/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Plus } from "lucide-react"
import { toast } from "sonner"
import type { Station, Tank } from "@/components/shared/station-tank-selector"

export function FuelConsumptionTable({
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

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟ سيتم إرجاع الكمية إلى الخزان ولن يتم حذف سجل القياس الفعلي إن وُجد.")) return
    try {
      await deleteFuelConsumption(id, isAdmin ? "admin" : "user")
      setData(data.filter((d) => d.id !== id))
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث (محطة، خزان، ملاحظات)..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="ml-2 size-4" /> تسجيل استهلاك جديد
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">المحطة / الخزان</th>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">الكمية المستهلكة (لتر)</th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد سجلات مطابقة
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
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
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {row.notes || "-"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-left">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-destructive/10 hover:text-destructive size-8"
                          onClick={() => handleDelete(row.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-secondary/50 border-t border-border font-medium">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-left">الإجمالي:</td>
                  <td className="px-4 py-3 text-destructive" dir="ltr">- {totalQuantity.toLocaleString()}</td>
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
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) window.location.reload()
          }}
          stations={stations}
          tanks={tanks}
        />
      )}
    </div>
  )
}
