"use client"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
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
  isAdmin,
  page = 1,
  pageSize = 25,
  hasMore = false,
}: { 
  initialData: any[]
  consumers: any[]
  oils: any[]
  isAdmin: boolean,
  page?: number,
  pageSize?: number,
  hasMore?: boolean,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [data] = useState(initialData)
  const [formOpen, setFormOpen] = useState(false)

  const currentQ = searchParams?.get("q") ?? ""
  const currentConsumer = searchParams?.get("consumerId") ?? ""
  const currentOil = searchParams?.get("oilId") ?? ""
  const currentFrom = searchParams?.get("from") ?? ""
  const currentTo = searchParams?.get("to") ?? ""
  const currentPage = Number(searchParams?.get("page") ?? page ?? 1)

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف عملية الصرف هذه؟")) return
    try {
      await deleteOilTransaction(id)
      toast.success("تم الحذف بنجاح")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "فشل في الحذف")
    }
  }
  function updateParam(key: string, value: string | number | null) {
    const params = new URLSearchParams(searchParams?.toString() ?? "")
    if (value === null || value === "" ) params.delete(key)
    else params.set(key, String(value))
    // reset to first page when filters change
    if (key !== "page") params.delete("page")
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ""}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 flex gap-2 items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالجهة، الصنف، الأسماء، أو الرقم..."
              className="pr-9"
              value={currentQ}
              onChange={(e) => updateParam("q", e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              className="border border-border rounded px-2 py-1 text-sm"
              value={currentConsumer}
              onChange={(e) => updateParam("consumerId", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">الكل (الجهات)</option>
              {consumers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              className="border border-border rounded px-2 py-1 text-sm"
              value={currentOil}
              onChange={(e) => updateParam("oilId", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">الكل (الأصناف)</option>
              {oils.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>

            <input type="date" className="border border-border rounded px-2 py-1 text-sm" value={currentFrom} onChange={(e) => updateParam("from", e.target.value || null)} />
            <input type="date" className="border border-border rounded px-2 py-1 text-sm" value={currentTo} onChange={(e) => updateParam("to", e.target.value || null)} />
          </div>
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
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد عمليات صرف مطابقة
                  </td>
                </tr>
              ) : (
                data.map((item) => (
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">صفحة {currentPage}</div>
        <div className="flex gap-2">
          <Button disabled={currentPage <= 1} onClick={() => updateParam("page", currentPage - 1)}>
            السابق
          </Button>
          <Button disabled={!hasMore} onClick={() => updateParam("page", currentPage + 1)}>
            التالي
          </Button>
        </div>
      </div>

      {formOpen && (
        <OilTransactionForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) router.refresh()
          }}
          consumers={consumers}
          oils={oils}
        />
      )}
    </div>
  )
}
