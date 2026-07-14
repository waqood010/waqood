"use client"

import { useState } from "react"
import { OilForm } from "./oil-form"
import { deleteOil } from "@/app/dashboard/oils/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Search, Plus, Droplets } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"
import { cn } from "@/lib/utils"

export function OilsTable({ initialData, isAdmin }: { initialData: any[], isAdmin: boolean }) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleDelete = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء."))) return
    try {
      await deleteOil(id, isAdmin ? "admin" : "user")
      setData(data.filter((d) => d.id !== id))
      toast.success("تم الحذف بنجاح")
    } catch (err: any) {
      const message = err?.message || err?.toString?.() || "فشل في الحذف"
      console.error("Oil delete failed:", err)
      toast.error(message)
    }
  }

  const filteredData = data.filter((d) => d.name.includes(search))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن صنف زيت أو شحم..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingItem(null); setFormOpen(true) }}>
            <Plus className="ml-2 size-4" /> إضافة صنف جديد
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">اسم الصنف</th>
                <th className="px-4 py-3 font-medium text-center">سعر الوحدة</th>
                <th className="px-4 py-3 font-medium text-center">وحدة القياس الجامعة</th>
                <th className="px-4 py-3 font-medium text-center">الرصيد الحالي</th>
                <th className="px-4 py-3 font-medium text-center">عدد الوحدات</th>
                <th className="px-4 py-3 font-medium text-center">حالة الرصيد</th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد أصناف مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isLow = item.currentBalance <= item.minAlertLevel
                  return (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <Droplets className="size-4 text-primary" />
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-center" dir="ltr">
                        {item.unitPrice ? `${item.unitPrice.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {item.aggregateUnit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                            {item.aggregateUnit}
                            <span className="text-muted-foreground font-normal">({item.aggregateUnitQuantity} {item.unit})</span>
                          </span>
                        ) : item.unit === "كرتونة" && item.packsPerCarton ? `${item.packsPerCarton} عبوة/كرتونة` :
                         item.unit === "برميل" && item.barrelQuantity ? `${item.barrelQuantity} لتر/برميل` : "-"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold" dir="ltr">
                        <span className={cn(isLow && "text-destructive")}>
                          {item.currentBalance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-primary" dir="rtl">
                        {item.aggregateUnit && item.aggregateUnitQuantity > 0 ? (
                          <span>
                            {Math.floor(item.currentBalance / item.aggregateUnitQuantity)} {item.aggregateUnit} و {(item.currentBalance % item.aggregateUnitQuantity).toFixed(2)} {item.unit}
                          </span>
                        ) : item.barrelQuantity && item.barrelQuantity > 0 ? (
                          <span>
                            {Math.floor(item.currentBalance / item.barrelQuantity)} برميل و {(item.currentBalance % item.barrelQuantity).toFixed(2)} {item.unit}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">
                            تنبيه (أقل من {item.minAlertLevel})
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                            متاح
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {item.notes || "-"}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-left">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setFormOpen(true) }}>
                              <Edit className="size-4 text-muted-foreground" />
                            </Button>
                            <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(item.id)}>
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
          </table>
        </div>
      </div>

      {formOpen && (
        <OilForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) window.location.reload()
          }}
          initialData={editingItem}
        />
      )}
    </div>
  )
}
