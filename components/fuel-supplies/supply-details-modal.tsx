"use client"

import { useEffect, useState } from "react"
import { getSupplyDistributions } from "@/app/dashboard/fuel-supplies/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SupplyDetailsModal({
  supply,
  open,
  onOpenChange,
}: {
  supply: any
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [distributions, setDistributions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && supply) {
      loadDistributions()
    }
  }, [open, supply])

  const loadDistributions = async () => {
    try {
      setLoading(true)
      const data = await getSupplyDistributions(supply.id)
      setDistributions(data)
    } catch (err: any) {
      toast.error(err.message || "فشل في جلب بيانات التوزيع")
    } finally {
      setLoading(false)
    }
  }

  const totalDistributed = distributions.reduce((sum, d) => sum + d.quantity, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">
            تفاصيل الوارد #{supply.documentNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supply Header Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-secondary/20 rounded-lg border border-border">
            <div>
              <div className="text-xs text-muted-foreground mb-1">رقم الفاتورة</div>
              <div className="font-semibold">{supply.invoiceNumber || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">المورد</div>
              <div className="font-semibold text-sm">{supply.supplierCompany || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">التاريخ</div>
              <div className="font-semibold" dir="ltr">
                {new Date(supply.date).toLocaleDateString("en-GB")}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">النوع</div>
              <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                {supply.fuelType.name}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">الكمية الإجمالية</div>
              <div className="font-semibold" dir="ltr">
                {supply.totalQuantity.toLocaleString()} لتر
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">الإجمالي (ج)</div>
              <div className="font-semibold" dir="ltr">
                {supply.totalPrice.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Distributions Table */}
          <div className="space-y-3">
            <h3 className="font-semibold text-right">المحطات المستلمة</h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground size-5" />
              </div>
            ) : distributions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground bg-secondary/20 rounded-md border border-dashed">
                لم يتم توزيع هذا الوارد على أي محطة بعد
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-medium">#</th>
                        <th className="px-4 py-3 font-medium">المحطة</th>
                        <th className="px-4 py-3 font-medium">الخزان</th>
                        <th className="px-4 py-3 font-medium">الكمية (لتر)</th>
                        <th className="px-4 py-3 font-medium">رقم التوريدة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {distributions.map((dist, idx) => (
                        <tr key={dist.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium">{dist.station.name}</td>
                          <td className="px-4 py-3">{dist.tank.name}</td>
                          <td className="px-4 py-3 font-medium" dir="ltr">
                            {dist.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                              #{dist.importNumber}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-secondary/50 border-t border-border font-medium">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-left">
                          الإجمالي:
                        </td>
                        <td className="px-4 py-3" dir="ltr">
                          {totalDistributed.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
