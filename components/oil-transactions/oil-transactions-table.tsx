"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { OilTransactionForm } from "./oil-transaction-form"
import { deleteOilTransaction } from "@/app/dashboard/oil-transactions/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Plus, Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"
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
  defaultFrom = "",
  defaultTo = "",
}: { 
  initialData: any[]
  consumers: any[]
  oils: any[]
  isAdmin: boolean
  page?: number
  pageSize?: number
  hasMore?: boolean
  defaultFrom?: string
  defaultTo?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [data, setData] = useState(initialData)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const currentQ = searchParams?.get("q") ?? ""
  const currentConsumer = searchParams?.get("consumerId") ?? ""
  const currentOil = searchParams?.get("oilId") ?? ""
  const currentFrom = searchParams?.get("from") ?? defaultFrom
  const currentTo = searchParams?.get("to") ?? defaultTo
  const currentPage = Number(searchParams?.get("page") ?? page ?? 1)

  const handleDelete = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من حذف عملية الصرف هذه؟"))) return
    setIsDeleting(true)
    try {
      await deleteOilTransaction(id)
      setData((prev) => prev.filter((item) => item.id !== id))
      toast.success("تم الحذف بنجاح")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "فشل في الحذف")
    } finally {
      setIsDeleting(false)
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
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-end sm:items-center">
        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">من:</span>
            <Input
              type="date"
              className="h-9 w-36 px-2 text-sm"
              value={currentFrom}
              onChange={(e) => updateParam("from", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">إلى:</span>
            <Input
              type="date"
              className="h-9 w-36 px-2 text-sm"
              value={currentTo}
              onChange={(e) => updateParam("to", e.target.value)}
            />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={currentConsumer}
            onChange={(e) => updateParam("consumerId", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">جميع الجهات</option>
            {consumers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={currentOil}
            onChange={(e) => updateParam("oilId", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">جميع الأصناف</option>
            {oils.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          <div className="relative flex-1 sm:flex-none sm:min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              className="pr-9 h-9"
              value={currentQ}
              onChange={(e) => updateParam("q", e.target.value)}
            />
          </div>

          {isAdmin && (
            <Button onClick={() => { setEditingItem(null); setFormOpen(true) }} className="h-9 shrink-0">
              <Plus className="ml-2 size-4" /> إضافة صرف
            </Button>
          )}
        </div>
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
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد عمليات صرف مطابقة
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {item.date ? format(new Date(item.date), 'dd MMM yyyy', { locale: ar }) : "-"}
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
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => { setEditingItem(item); setFormOpen(true) }}
                            disabled={isDeleting}
                          >
                            <Edit className="size-4 text-muted-foreground" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="hover:bg-destructive/10 hover:text-destructive" 
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
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
            if (!o) {
              setEditingItem(null)
              router.refresh()
            }
          }}
          consumers={consumers}
          oils={oils}
          initialData={editingItem}
        />
      )}
    </div>
  )
}
