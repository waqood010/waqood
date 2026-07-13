"use client"

import { useState, useEffect } from "react"
import { OilSupplyForm } from "./oil-supply-form"
import { deleteOilSupply } from "@/app/dashboard/oil-supplies/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Plus, Edit3, Loader2 } from "lucide-react"
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
  const [editingItem, setEditingItem] = useState<any>(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (fromDate) params.append("from", fromDate)
      if (toDate) params.append("to", toDate)
      
      const res = await fetch(`/api/oil-supplies?${params.toString()}`)
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast.error("فشل في جلب البيانات")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [fromDate, toDate])

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

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleSaved = async () => {
    setFormOpen(false)
    setEditingItem(null)
    await loadData()
  }

  const filteredData = data.filter((d) => 
    d.supplier?.includes(search) || 
    d.oilName.includes(search) ||
    d.contractNumber?.includes(search) ||
    (d.invoiceNumber && d.invoiceNumber.includes(search))
  )

  const totalQuantity = filteredData.reduce((sum, d) => sum + d.quantity, 0)
  const totalPrice = filteredData.reduce((sum, d) => sum + d.price, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
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

        <div className="flex flex-col gap-4 w-full sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:flex-none sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالمورد أو الصنف أو الفاتورة..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button onClick={() => { setEditingItem(null); setFormOpen(true) }}>
              <Plus className="ml-2 size-4" /> إضافة توريد
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">الصنف</th>
                <th className="px-4 py-3 font-medium text-center">الوحدة</th>
                <th className="px-4 py-3 font-medium text-center">سعر الوحدة</th>
                <th className="px-4 py-3 font-medium">الكمية</th>
                <th className="px-4 py-3 font-medium">السعر الإجمالي</th>
                <th className="px-4 py-3 font-medium">المورد</th>
                <th className="px-4 py-3 font-medium">رقم الفاتورة</th>
                <th className="px-4 py-3 font-medium">رقم العقد</th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="px-4 py-8 text-center text-muted-foreground">
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
                      <td className="px-4 py-3 text-center text-xs">
                        {item.aggregateUnit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                            {item.aggregateUnit}
                            <span className="text-muted-foreground font-normal">({item.aggregateUnitQuantity} {item.unit})</span>
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-center" dir="ltr">
                        {item.unitPrice ? `${item.unitPrice.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-4 py-3 font-bold" dir="ltr">
                        {item.quantity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                        {item.price ? `${item.price.toLocaleString()} ج.م` : "0 ج.م"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.supplier || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm" dir="ltr">
                        {item.invoiceNumber || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm" dir="ltr">
                        {item.contractNumber || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {item.notes || "-"}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-left">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit3 className="size-4 text-muted-foreground" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-bold border-t-2 border-border">
                    <td colSpan={4} className="px-4 py-3 text-right">
                      المجموع
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {totalQuantity.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400" dir="ltr">
                      {totalPrice.toLocaleString()} ج.م
                    </td>
                    <td colSpan={isAdmin ? 5 : 4} />
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
          onOpenChange={setFormOpen}
          oils={oils}
          initialData={editingItem}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
