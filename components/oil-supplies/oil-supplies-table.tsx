"use client"

import { useState } from "react"
import { OilSupplyForm } from "./oil-supply-form"
import { deleteOilSupply } from "@/app/dashboard/oil-supplies/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Plus } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export function OilSuppliesTable({ 
  initialData, 
  oils,
  isAdmin 
}: { 
  initialData: any[]
  oils: any[]
  isAdmin: boolean 
}) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف عملية التوريد هذه؟")) return
    try {
      await deleteOilSupply(id)
      setData(data.filter((d) => d.id !== id))
      toast.success("تم الحذف بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في الحذف")
    }
  }

  const filteredData = data.filter((d) => 
    d.supplier.includes(search) || 
    d.oilName.includes(search) ||
    (d.invoiceNumber && d.invoiceNumber.includes(search))
  )

  const totalQuantity = filteredData.reduce((sum, d) => sum + d.quantity, 0)
  const totalPrice = filteredData.reduce((sum, d) => sum + d.price, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالمورد أو الصنف أو الفاتورة..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="ml-2 size-4" /> إضافة توريد
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">الصنف</th>
                <th className="px-4 py-3 font-medium">الكمية</th>
                <th className="px-4 py-3 font-medium">السعر الإجمالي</th>
                <th className="px-4 py-3 font-medium">المورد</th>
                <th className="px-4 py-3 font-medium">رقم الفاتورة</th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد توريدات مطابقة
                  </td>
                </tr>
              ) : (
                <>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {item.date ? format(new Date(item.date), 'dd MMMM yyyy', { locale: ar }) : "-"}
                      </td>
                      <td className="px-4 py-3">{item.oilName}</td>
                      <td className="px-4 py-3 font-bold" dir="ltr">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                        {item.price ? `${item.price.toLocaleString()} ج.م` : "0 ج.م"}
                      </td>
                      <td className="px-4 py-3">{item.supplier}</td>
                      <td className="px-4 py-3 font-mono" dir="ltr">{item.invoiceNumber || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.notes || "-"}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-left">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-secondary/20 font-bold border-t-2 border-border">
                    <td colSpan={2} className="px-4 py-3">المجموع</td>
                    <td className="px-4 py-3" dir="ltr">{totalQuantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400" dir="ltr">{totalPrice.toLocaleString()} ج.م</td>
                    <td colSpan={isAdmin ? 4 : 3} className="px-4 py-3"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <OilSupplyForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) window.location.reload()
          }}
          oils={oils}
        />
      )}
    </div>
  )
}
