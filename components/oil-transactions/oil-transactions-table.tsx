"use client"

import { useState } from "react"
import { OilTransactionForm } from "./oil-transaction-form"
import { deleteOilTransaction } from "@/app/dashboard/oil-transactions/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Plus } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export function OilTransactionsTable({ 
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

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف عملية الصرف هذه؟")) return
    try {
      await deleteOilTransaction(id)
      setData(data.filter((d) => d.id !== id))
      toast.success("تم الحذف بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في الحذف")
    }
  }

  const filteredData = data.filter((d) => 
    d.consumerName.includes(search) || 
    d.oilName.includes(search) ||
    d.dispenserName.includes(search) ||
    d.receiverName.includes(search) ||
    (d.serialNumber && d.serialNumber.includes(search))
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالجهة، الصنف، الأسماء، أو الرقم..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="ml-2 size-4" /> إضافة صرف
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">الجهة المستهلكة</th>
                <th className="px-4 py-3 font-medium">الصنف</th>
                <th className="px-4 py-3 font-medium">الكمية</th>
                <th className="px-4 py-3 font-medium">الصارف</th>
                <th className="px-4 py-3 font-medium">المستلم</th>
                <th className="px-4 py-3 font-medium">الرقم/السند</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد عمليات صرف مطابقة
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {item.date ? format(new Date(item.date), 'dd MMMM yyyy', { locale: ar }) : "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">{item.consumerName}</td>
                    <td className="px-4 py-3">{item.oilName}</td>
                    <td className="px-4 py-3 font-bold" dir="ltr">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3">{item.dispenserName}</td>
                    <td className="px-4 py-3">
                      {item.receiverName}
                      {item.receiverRank && <span className="text-muted-foreground text-xs block">{item.receiverRank}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono" dir="ltr">{item.serialNumber || "-"}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <OilTransactionForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) window.location.reload()
          }}
          consumers={consumers}
          oils={oils}
        />
      )}
    </div>
  )
}
