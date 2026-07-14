"use client"

import { useState } from "react"
import { OilRateForm } from "./oil-rate-form"
import { deleteOilRate } from "@/app/dashboard/oil-rates/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Search, Plus } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"

export function OilRatesTable({ 
  initialData, 
  consumers,
  oils,
  isAdmin 
}: { 
  initialData: any[]
  consumers: any[]
  oils: any[]
  isAdmin: boolean 
}) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleDelete = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من حذف هذا المعدل؟"))) return
    try {
      await deleteOilRate(id, isAdmin ? "admin" : "user")
      setData(data.filter((d) => d.id !== id))
      toast.success("تم الحذف بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في الحذف")
    }
  }

  const filteredData = data.filter((d) => 
    d.consumer.name.includes(search) || 
    d.oil.name.includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالجهة أو الصنف..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingItem(null); setFormOpen(true) }}>
            <Plus className="ml-2 size-4" /> إضافة معدل استهلاك
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">الجهة المستهلكة</th>
                <th className="px-4 py-3 font-medium">الصنف (الزيت / الشحم)</th>
                <th className="px-4 py-3 font-medium">المعدل المسموح</th>
                <th className="px-4 py-3 font-medium">الفترة</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد معدلات مطابقة
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{item.consumer.name}</td>
                    <td className="px-4 py-3">{item.oil.name}</td>
                    <td className="px-4 py-3 font-bold" dir="ltr">
                      {item.rate} <span className="text-muted-foreground font-normal text-xs">{item.unit || item.oil.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {item.period === "monthly" ? "شهري" : "أسبوعي"}
                      </span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <OilRateForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) window.location.reload()
          }}
          initialData={editingItem}
          consumers={consumers}
          oils={oils}
        />
      )}
    </div>
  )
}
