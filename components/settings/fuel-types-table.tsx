"use client"

import { useState } from "react"
import { deleteFuelType } from "@/app/dashboard/settings/actions"
import { FuelTypeForm } from "./fuel-type-form"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

export function FuelTypesTable({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا النوع من الوقود؟ سيؤثر ذلك على الخزانات والتقارير المرتبطة.")) return
    try {
      await deleteFuelType(id)
      setData(data.filter((d) => d.id !== id))
      toast.success("تم حذف نوع الوقود بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في الحذف")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditingItem(null); setFormOpen(true) }}>
          <Plus className="ml-2 size-4" /> إضافة نوع وقود
        </Button>
      </div>

      <div className="relative w-full overflow-auto border rounded-md">
        <table className="w-full caption-bottom text-sm text-right">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="h-10 px-4 font-medium text-muted-foreground">الاسم</th>
              <th className="h-10 px-4 font-medium text-muted-foreground">معامل التحويل</th>
              <th className="h-10 px-4 font-medium text-muted-foreground">حد التنبيه الأدنى</th>
              <th className="h-10 px-4 font-medium text-muted-foreground">نسبة التنبيه الحرج</th>
              <th className="h-10 px-4 font-medium text-muted-foreground text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  لا توجد أنواع وقود مسجلة.
                </td>
              </tr>
            ) : (
              data.map((ft) => (
                <tr key={ft.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-semibold">{ft.name}</td>
                  <td className="p-4">{ft.tonToLiter} لتر/طن</td>
                  <td className="p-4" dir="ltr">{(ft.minAlertLevel || 0).toLocaleString()} لتر</td>
                  <td className="p-4">{ft.criticalAlertPercent || 10}%</td>
                  <td className="p-4 text-left">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingItem(ft); setFormOpen(true) }}
                      >
                        <Edit className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(ft.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <FuelTypeForm
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
