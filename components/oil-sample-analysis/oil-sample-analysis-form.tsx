"use client"

import { useState } from "react"
import { createOilSampleAnalysis, updateOilSampleAnalysis } from "@/app/dashboard/oil-sample-analysis/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function OilSampleAnalysisForm({
  open,
  onOpenChange,
  initialData,
  oils,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
  oils: any[]
}) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(initialData?.status || "review")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const oilId = Number(formData.get("oilId"))
    const analysisNumber = formData.get("analysisNumber") as string
    const analysisDate = formData.get("analysisDate") as string
    const resultDate = (formData.get("resultDate") as string) || null
    const cost = Number(formData.get("cost")) || 0
    const notes = (formData.get("notes") as string) || null

    try {
      if (initialData) {
        await updateOilSampleAnalysis(initialData.id, {
          oilId,
          analysisNumber,
          analysisDate,
          resultDate,
          status,
          cost,
          notes,
        })
        toast.success("تم تحديث التحليل بنجاح")
      } else {
        await createOilSampleAnalysis({
          oilId,
          analysisNumber,
          analysisDate,
          resultDate,
          status,
          cost,
          notes,
        })
        toast.success("تم حفظ التحليل بنجاح")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء الحفظ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>{initialData ? "تعديل تحليل العينة" : "إضافة تحليل عينة جديد"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="analysisNumber">رقم التحليل</Label>
              <Input id="analysisNumber" name="analysisNumber" required defaultValue={initialData?.analysisNumber || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oilId">الصنف</Label>
              <select
                id="oilId"
                name="oilId"
                required
                defaultValue={initialData?.oilId?.toString() || ""}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-right"
              >
                <option value="">اختر الصنف...</option>
                {oils.map((oil) => (
                  <option key={oil.id} value={oil.id.toString()}>
                    {oil.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="analysisDate">تاريخ التحليل</Label>
              <Input
                id="analysisDate"
                name="analysisDate"
                type="date"
                required
                defaultValue={
                  initialData?.analysisDate
                    ? new Date(initialData.analysisDate).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resultDate">تاريخ النتيجة</Label>
              <Input
                id="resultDate"
                name="resultDate"
                type="date"
                defaultValue={
                  initialData?.resultDate
                    ? new Date(initialData.resultDate).toISOString().split("T")[0]
                    : ""
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-right"
              >
                <option value="review">تحت المراجعة</option>
                <option value="matched">مطابق</option>
                <option value="unmatched">غير مطابق</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">تكلفة التحليل</Label>
              <Input id="cost" name="cost" type="number" step="0.01" min="0" defaultValue={initialData?.cost ?? 0} dir="ltr" className="text-right" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" name="notes" defaultValue={initialData?.notes || ""} className="resize-none" />
          </div>

          <DialogFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {initialData ? "تحديث التحليل" : "حفظ التحليل"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
