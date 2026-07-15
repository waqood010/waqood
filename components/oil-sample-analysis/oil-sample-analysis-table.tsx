"use client"

import { useState } from "react"
import { deleteOilSampleAnalysis } from "@/app/dashboard/oil-sample-analysis/actions"
import { OilSampleAnalysisForm } from "./oil-sample-analysis-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Search, Plus } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"
import { formatArabicDate } from "@/lib/date"

export function OilSampleAnalysisTable({ initialData, oils, isAdmin }: { initialData: any[]; oils: any[]; isAdmin: boolean }) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const filteredData = data.filter((item) =>
    item.analysisNumber.includes(search) ||
    item.oilName.includes(search) ||
    item.status.includes(search)
  )

  const handleDelete = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من حذف هذا التحليل؟"))) return
    try {
      await deleteOilSampleAnalysis(id)
      setData(data.filter((item) => item.id !== id))
      toast.success("تم حذف التحليل")
    } catch (err: any) {
      toast.error(err?.message || "فشل في حذف التحليل")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم التحليل أو اسم الصنف أو الحالة..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingItem(null); setFormOpen(true) }}>
            <Plus className="ml-2 size-4" /> تحليل جديد
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">رقم التحليل</th>
              <th className="px-4 py-3 font-medium">الصنف</th>
              <th className="px-4 py-3 font-medium">تاريخ التحليل</th>
              <th className="px-4 py-3 font-medium">تاريخ النتيجة</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">تكلفة التحليل</th>
              <th className="px-4 py-3 font-medium">ملاحظات</th>
              {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">
                  لا يوجد تحليلات تطابق البحث
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">{item.analysisNumber}</td>
                  <td className="px-4 py-3">{item.oilName}</td>
                  <td className="px-4 py-3">{formatArabicDate(item.analysisDate)}</td>
                  <td className="px-4 py-3">{item.resultDate ? formatArabicDate(item.resultDate) : "-"}</td>
                  <td className="px-4 py-3">{item.status === "review" ? "تحت المراجعة" : item.status === "matched" ? "مطابق" : "غير مطابق"}</td>
                  <td className="px-4 py-3" dir="ltr">{item.cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.notes || "-"}</td>
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

      {formOpen && (
        <OilSampleAnalysisForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) window.location.reload()
          }}
          initialData={editingItem}
          oils={oils}
        />
      )}
    </div>
  )
}
