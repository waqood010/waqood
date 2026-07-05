"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createStation, updateStation } from "@/app/dashboard/stations/actions"

export function StationForm({ 
  open, 
  onOpenChange,
  initialData 
}: { 
  open: boolean
  onOpenChange: (o: boolean) => void
  initialData?: any 
}) {
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const notes = formData.get("notes") as string
    
    try {
      if (initialData) {
        await updateStation(initialData.id, { name, notes })
        toast.success("تم تعديل المحطة بنجاح")
      } else {
        await createStation({ name, notes })
        toast.success("تم إضافة المحطة بنجاح")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>{initialData ? "تعديل المحطة" : "إضافة محطة جديدة"}</DialogTitle>
          <DialogDescription>
            أدخل بيانات المحطة الأساسية هنا. يمكنك إضافة الخزانات لاحقاً.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المحطة</Label>
              <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="مثال: المحطة الرئيسية" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Input id="notes" name="notes" defaultValue={initialData?.notes} placeholder="أي ملاحظات إضافية..." />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {initialData ? "حفظ التعديلات" : "إضافة المحطة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
