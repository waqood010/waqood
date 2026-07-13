"use client"

import { useState } from "react"
import { createOilSupply, updateOilSupply } from "@/app/dashboard/oil-supplies/actions"
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
import { Loader2 } from "lucide-react"

export function OilSupplyForm({ 
  open, 
  onOpenChange,
  oils,
  initialData,
  onSaved,
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  oils: any[]
  initialData?: any
  onSaved?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "")
  const [unitPrice, setUnitPrice] = useState(initialData?.unitPrice?.toString() || "")
  const [totalPrice, setTotalPrice] = useState(initialData?.price?.toString() || "")

  // Auto-calculate total price
  const handleQuantityChange = (value: string) => {
    setQuantity(value)
    calculateTotalPrice(parseFloat(value) || 0, parseFloat(unitPrice) || 0)
  }

  const handleUnitPriceChange = (value: string) => {
    setUnitPrice(value)
    calculateTotalPrice(parseFloat(quantity) || 0, parseFloat(value) || 0)
  }

  const calculateTotalPrice = (qty: number, price: number) => {
    const total = (qty * price).toFixed(2)
    setTotalPrice(total)
  }

  const handleOilChange = (oilId: string) => {
    const selectedOil = oils.find(o => o.id.toString() === oilId)
    if (selectedOil && selectedOil.unitPrice) {
      setUnitPrice(selectedOil.unitPrice.toString())
      calculateTotalPrice(parseFloat(quantity) || 0, selectedOil.unitPrice)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const data = {
      date: (e.currentTarget.elements.namedItem("date") as HTMLInputElement).value,
      quantity: parseFloat(quantity),
      price: parseFloat(totalPrice),
      supplier: (e.currentTarget.elements.namedItem("supplier") as HTMLInputElement).value,
      invoiceNumber: (e.currentTarget.elements.namedItem("invoiceNumber") as HTMLInputElement)?.value || null,
      contractNumber: (e.currentTarget.elements.namedItem("contractNumber") as HTMLInputElement)?.value || null,
      notes: (e.currentTarget.elements.namedItem("notes") as HTMLInputElement)?.value || null,
      oilId: Number((e.currentTarget.elements.namedItem("oilId") as HTMLSelectElement).value),
    }

    try {
      if (initialData) {
        await updateOilSupply(initialData.id, data)
        toast.success("تم تعديل توريد الزيت بنجاح")
      } else {
        await createOilSupply(data)
        toast.success("تم تسجيل توريد الزيت بنجاح")
      }
      onOpenChange(false)
      onSaved?.()
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
          <DialogTitle>{initialData ? "تعديل توريد الزيت" : "تسجيل توريد زيت جديد"}</DialogTitle>
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
                defaultValue={initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oilId">الصنف (الزيت / الشحم)</Label>
              <select
                id="oilId"
                name="oilId"
                required
                defaultValue={initialData?.oilId || ""}
                onChange={(e) => handleOilChange(e.target.value)}
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
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">سعر الوحدة (ج.م)</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">السعر الإجمالي (ج.م) - محسوب تلقائياً</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={totalPrice}
              readOnly
              dir="ltr"
              className="text-right bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {quantity && unitPrice ? `${quantity} × ${unitPrice} = ${totalPrice}` : "أدخل الكمية وسعر الوحدة"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">المورد</Label>
              <Input
                id="supplier"
                name="supplier"
                required
                defaultValue={initialData?.supplier || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">رقم الفاتورة (اختياري)</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                defaultValue={initialData?.invoiceNumber || ""}
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractNumber">رقم العقد (اختياري)</Label>
            <Input
              id="contractNumber"
              name="contractNumber"
              defaultValue={initialData?.contractNumber || ""}
              dir="ltr"
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={initialData?.notes || ""}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {loading ? "جاري الحفظ..." : initialData ? "حفظ التعديلات" : "حفظ التوريد"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
