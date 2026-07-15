"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { OilTransactionForm } from "./oil-transaction-form"
import { deleteOilTransaction, approveOilTransaction, rejectOilTransaction } from "@/app/dashboard/oil-transactions/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Search, Plus, Edit, Loader2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"
import { formatArabicDate } from "@/lib/date"

const STATUS_LABELS = {
  approved: { label: "موافق عليه", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  pending: { label: "معلق", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  rejected: { label: "مرفوض", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

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
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const currentQ = searchParams?.get("q") ?? ""
  const currentConsumer = searchParams?.get("consumerId") ?? ""
  const currentOil = searchParams?.get("oilId") ?? ""
  const currentStatus = searchParams?.get("status") ?? "all"
  const currentFrom = searchParams?.get("from") ?? defaultFrom
  const currentTo = searchParams?.get("to") ?? defaultTo
  const currentPage = Number(searchParams?.get("page") ?? page ?? 1)

  const handleApprove = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من الموافقة على هذه العملية؟"))) return
    setIsApproving(true)
    try {
      await approveOilTransaction(id)
      setData((prev) => prev.map((item) => item.id === id ? { ...item, status: "approved" } : item))
      toast.success("تم الموافقة على العملية")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "فشل في الموافقة")
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectingId) return
    if (!rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض")
      return
    }
    setIsRejecting(true)
    try {
      await rejectOilTransaction(rejectingId, rejectionReason.trim())
      setData((prev) => prev.map((item) => item.id === rejectingId ? { ...item, status: "rejected", rejectionReason } : item))
      toast.success("تم رفض العملية")
      setRejectingId(null)
      setRejectionReason("")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "فشل في الرفض")
    } finally {
      setIsRejecting(false)
    }
  }

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

          {isAdmin && (
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={currentStatus}
              onChange={(e) => updateParam("status", e.target.value)}
            >
              <option value="all">جميع الحالات</option>
              <option value="approved">موافق عليه</option>
              <option value="pending">معلق</option>
              <option value="rejected">مرفوض</option>
            </select>
          )}

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
                {isAdmin && <th className="px-4 py-3 font-medium">الحالة</th>}
                {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 7} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد عمليات صرف مطابقة
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {item.date ? formatArabicDate(item.date) : "-"}
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
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_LABELS[item.status as keyof typeof STATUS_LABELS]?.className || ""}`}>
                          {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS]?.label || item.status}
                        </span>
                        {item.status === "rejected" && item.rejectionReason && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-xs">
                            {item.rejectionReason}
                          </div>
                        )}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-4 py-3 text-left">
                        <div className="flex justify-end gap-2">
                          {item.status === "pending" && (
                            <>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
                                onClick={() => handleApprove(item.id)}
                                disabled={isApproving || isDeleting}
                                title="موافقة"
                              >
                                <Check className="size-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                                onClick={() => { setRejectingId(item.id); setRejectionReason("") }}
                                disabled={isRejecting || isDeleting}
                                title="رفض"
                              >
                                <X className="size-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => { setEditingItem(item); setFormOpen(true) }}
                            disabled={isDeleting || item.status !== "approved"}
                            title={item.status !== "approved" ? "لا يمكن تعديل عمليات غير موافق عليها" : "تعديل"}
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

      <Dialog open={rejectingId !== null} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض العملية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">سبب الرفض:</label>
              <Textarea
                placeholder="أدخل سبب رفض هذه العملية..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)} disabled={isRejecting}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? "جاري الرفض..." : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
