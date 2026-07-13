"use client"

import { useState } from "react"
import { ConsumerForm } from "./consumer-form"
import { 
  deleteConsumer, 
  getConsumerWithRates, 
  createOilRate, 
  updateOilRate,
  deleteOilRate,
  calculateNextRefillDate
} from "@/app/dashboard/consumers/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, Search, Plus, Users, ChevronDown, ChevronUp, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

const RATE_UNITS = ["عبوة", "لتر", "كيلو", "كرتونة", "برميل"]

export function ConsumersTable({ initialData, oils, isAdmin }: { initialData: any[], oils: any[], isAdmin: boolean }) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingConsumer, setEditingConsumer] = useState<any>(null)
  
  // Expanded consumer states
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedData, setExpandedData] = useState<any>(null)
  const [isLoadingExpand, setIsLoadingExpand] = useState(false)
  
  // Add rate form states
  const [showAddRate, setShowAddRate] = useState(false)
  const [selectedOilId, setSelectedOilId] = useState<number>(oils[0]?.id || 0)
  const [rateValue, setRateValue] = useState("")
  const [rateUnit, setRateUnit] = useState("عبوة")
  const [ratePeriod, setRatePeriod] = useState("monthly")
  const [isAddingRate, setIsAddingRate] = useState(false)
  
  // Edit rate states
  const [editingRate, setEditingRate] = useState<any>(null)
  const [editRateValue, setEditRateValue] = useState("")
  const [editRateUnit, setEditRateUnit] = useState("")
  const [editRatePeriod, setEditRatePeriod] = useState("")
  const [isEditingRate, setIsEditingRate] = useState(false)

  const handleDeleteConsumer = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الجهة؟")) return
    try {
      await deleteConsumer(id, isAdmin ? "admin" : "user")
      setData(data.filter((d) => d.id !== id))
      toast.success("تم الحذف بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في الحذف")
    }
  }

  const handleExpandClick = async (consumerId: number) => {
    if (expandedId === consumerId) {
      setExpandedId(null)
      setExpandedData(null)
      setShowAddRate(false)
      setEditingRate(null)
    } else {
      setIsLoadingExpand(true)
      try {
        const consumerData = await getConsumerWithRates(consumerId)
        setExpandedData(consumerData)
        setExpandedId(consumerId)
      } catch (err: any) {
        toast.error("فشل في تحميل البيانات")
      } finally {
        setIsLoadingExpand(false)
      }
    }
  }

  const handleAddRate = async () => {
    if (!rateValue || !selectedOilId) {
      toast.error("يرجى ملء جميع الحقول")
      return
    }

    setIsAddingRate(true)
    try {
      await createOilRate({
        consumerId: expandedId!,
        oilId: selectedOilId,
        rate: Number(rateValue),
        unit: rateUnit,
        period: ratePeriod,
      })

      // Reload expanded data
      const consumerData = await getConsumerWithRates(expandedId!)
      setExpandedData(consumerData)

      // Reset form
      setShowAddRate(false)
      setRateValue("")
      setSelectedOilId(oils[0]?.id || 0)
      setRateUnit("عبوة")
      setRatePeriod("monthly")

      toast.success("تم إضافة معدل الاستهلاك بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في الإضافة")
    } finally {
      setIsAddingRate(false)
    }
  }

  const handleStartEditRate = (rate: any) => {
    setEditingRate(rate)
    setEditRateValue(String(rate.rate))
    setEditRateUnit(rate.unit)
    setEditRatePeriod(rate.period)
  }

  const handleSaveEditRate = async () => {
    if (!editRateValue) {
      toast.error("يرجى ملء قيمة المعدل")
      return
    }

    setIsEditingRate(true)
    try {
      await updateOilRate(editingRate.id, {
        rate: Number(editRateValue),
        unit: editRateUnit,
        period: editRatePeriod,
      })

      // Reload expanded data
      const consumerData = await getConsumerWithRates(expandedId!)
      setExpandedData(consumerData)

      setEditingRate(null)
      toast.success("تم تحديث معدل الاستهلاك بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في التحديث")
    } finally {
      setIsEditingRate(false)
    }
  }

  const handleDeleteRate = async (rateId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المعدل؟")) return

    try {
      await deleteOilRate(rateId, isAdmin ? "admin" : "user")

      // Reload expanded data
      if (expandedId) {
        const consumerData = await getConsumerWithRates(expandedId)
        setExpandedData(consumerData)
      }

      toast.success("تم حذف المعدل بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في الحذف")
    }
  }

  const filteredData = data.filter((d) => d.name.includes(search))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن جهة..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingConsumer(null); setFormOpen(true) }}>
            <Plus className="ml-2 size-4" /> إضافة جهة جديدة
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border text-right">
              <tr>
                <th className="px-4 py-3 font-medium"></th>
                <th className="px-4 py-3 font-medium">الجهة المستهلكة</th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد جهات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tbody key={item.id}>
                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleExpandClick(item.id)}
                          disabled={isLoadingExpand && expandedId === item.id}
                        >
                          {isLoadingExpand && expandedId === item.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : expandedId === item.id ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </Button>
                      </td>
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <Users className="size-4 text-primary" />
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {item.notes || "-"}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-left">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingConsumer(item); setFormOpen(true) }}>
                              <Edit className="size-4 text-muted-foreground" />
                            </Button>
                            <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteConsumer(item.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Expanded Row with Oil Rates */}
                    {expandedId === item.id && expandedData && (
                      <tr className="bg-muted/30">
                        <td colSpan={isAdmin ? 4 : 3} className="px-4 py-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-3">معدلات الاستهلاك ومعاد الصرف القادم</h4>
                              
                              {expandedData.rates.length === 0 ? (
                                <p className="text-sm text-muted-foreground mb-4">لا توجد معدلات استهلاك محددة لهذه الجهة</p>
                              ) : (
                                <div className="grid gap-3 mb-4">
                                  {expandedData.rates.map((rate: any) => (
                                    <div key={rate.id}>
                                      {editingRate?.id === rate.id ? (
                                        // Edit form
                                        <div className="p-3 rounded-md border border-border bg-card space-y-3">
                                          <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm">{rate.oilName}</p>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => setEditingRate(null)}
                                            >
                                              <X className="size-4" />
                                            </Button>
                                          </div>
                                          
                                          <div className="grid grid-cols-3 gap-2">
                                            <div className="space-y-1">
                                              <Label className="text-xs">المعدل</Label>
                                              <Input
                                                type="number"
                                                step="0.01"
                                                value={editRateValue}
                                                onChange={(e) => setEditRateValue(e.target.value)}
                                                placeholder="0"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">الوحدة</Label>
                                              <select
                                                value={editRateUnit}
                                                onChange={(e) => setEditRateUnit(e.target.value)}
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm"
                                              >
                                                {RATE_UNITS.map((u) => (
                                                  <option key={u} value={u}>{u}</option>
                                                ))}
                                              </select>
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">الفترة</Label>
                                              <select
                                                value={editRatePeriod}
                                                onChange={(e) => setEditRatePeriod(e.target.value)}
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm"
                                              >
                                                <option value="monthly">شهري</option>
                                                <option value="weekly">أسبوعي</option>
                                              </select>
                                            </div>
                                          </div>
                                          
                                          <div className="flex gap-2 justify-end">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => setEditingRate(null)}
                                            >
                                              إلغاء
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={handleSaveEditRate}
                                              disabled={isEditingRate}
                                            >
                                              {isEditingRate && <Loader2 className="ml-2 size-3 animate-spin" />}
                                              حفظ
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        // Display view
                                        <div className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:bg-muted/50 transition-colors">
                                          <div className="flex-1">
                                            <p className="font-medium text-sm">{rate.oilName}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {rate.rate} {rate.unit} / {rate.period === 'weekly' ? 'أسبوعي' : 'شهري'}
                                            </p>
                                          </div>
                                          <div className="flex flex-col items-end gap-1">
                                            <p className="text-xs font-medium text-primary">معاد الصرف القادم</p>
                                            <p className="text-sm font-semibold" dir="ltr">
                                              {rate.nextRefillDate 
                                                ? format(new Date(rate.nextRefillDate), 'dd MMM yyyy', { locale: ar })
                                                : <span className="text-muted-foreground text-xs">لم يحدد</span>
                                              }
                                            </p>
                                          </div>
                                          {isAdmin && (
                                            <div className="flex gap-1 ml-3">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleStartEditRate(rate)}
                                              >
                                                <Edit className="size-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleDeleteRate(rate.id)}
                                              >
                                                <Trash2 className="size-3" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add Rate Form */}
                              {isAdmin && (
                                <>
                                  {showAddRate ? (
                                    <div className="p-3 rounded-md border border-border bg-card space-y-3">
                                      <div className="flex items-center justify-between">
                                        <p className="font-medium text-sm">إضافة معدل استهلاك جديد</p>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setShowAddRate(false)}
                                        >
                                          <X className="size-4" />
                                        </Button>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label className="text-xs">الصنف (الزيت / الشحم)</Label>
                                        <select
                                          value={selectedOilId}
                                          onChange={(e) => setSelectedOilId(Number(e.target.value))}
                                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                          {oils.map((o) => (
                                            <option key={o.id} value={o.id}>{o.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-xs">المعدل</Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={rateValue}
                                            onChange={(e) => setRateValue(e.target.value)}
                                            placeholder="0"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">الوحدة</Label>
                                          <select
                                            value={rateUnit}
                                            onChange={(e) => setRateUnit(e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm"
                                          >
                                            {RATE_UNITS.map((u) => (
                                              <option key={u} value={u}>{u}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">الفترة</Label>
                                          <select
                                            value={ratePeriod}
                                            onChange={(e) => setRatePeriod(e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm"
                                          >
                                            <option value="monthly">شهري</option>
                                            <option value="weekly">أسبوعي</option>
                                          </select>
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setShowAddRate(false)}
                                        >
                                          إلغاء
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={handleAddRate}
                                          disabled={isAddingRate}
                                        >
                                          {isAddingRate && <Loader2 className="ml-2 size-3 animate-spin" />}
                                          إضافة
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setShowAddRate(true)}
                                    >
                                      <Plus className="ml-2 size-4" /> إضافة معدل استهلاك
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <ConsumerForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) window.location.reload()
          }}
          initialData={editingConsumer}
        />
      )}
    </div>
  )
}
