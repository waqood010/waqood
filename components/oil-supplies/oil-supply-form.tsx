"use client"

import { useState } from "react"
import { createOilSupply } from "@/app/dashboard/oil-supplies/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export function OilSupplyForm({ 
  open, 
  onOpenChange,
  oils
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  oils: any[]
}) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get("date") as string,
      quantity: Number(formData.get("quantity")),
      price: Number(formData.get("price")),
      supplier: formData.get("supplier") as string,
      invoiceNumber: (formData.get("invoiceNumber") as string) || null,
      notes: (formData.get("notes") as string) || null,
      oilId: Number(formData.get("oilId")),
    }

    try {
      await createOilSupply(data)
      toast.success("تم تسجيل توريد الزيت بنجاح")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الحفظ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تسجيل توريد زيت جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oilId">الصنف (الزيت / الشحم)</Label>
              <select
                id="oilId"
                name="oilId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-right"
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
              <Label htmlFor="quantity">الكمية</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                min="0"
                required
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">السعر الإجمالي (ج.م)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">المورد</Label>
              <Input
                id="supplier"
                name="supplier"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">رقم الفاتورة (اختياري)</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              name="notes"
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ التوريد"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
