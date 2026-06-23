"use client"

import { useState } from "react"
import { ConsumerForm } from "./consumer-form"
import { deleteConsumer } from "@/app/dashboard/consumers/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, Search, Plus, Users } from "lucide-react"
import { toast } from "sonner"

export function ConsumersTable({ initialData, isAdmin }: { initialData: any[], isAdmin: boolean }) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الجهة؟")) return
    try {
      await deleteConsumer(id, isAdmin ? "admin" : "user")
      setData(data.filter((d) => d.id !== id))
      toast.success("تم الحذف بنجاح")
    } catch (err: any) {
      toast.error(err.message || "فشل في الحذف")
    }
  }

  const filteredData = data.filter((d) => 
    d.name.includes(search) || 
    (d.type && d.type.includes(search))
  )

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
          <Button onClick={() => { setEditingItem(null); setFormOpen(true) }}>
            <Plus className="ml-2 size-4" /> إضافة جهة جديدة
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">الجهة المستهلكة</th>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد جهات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      {item.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                        {item.type || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {item.notes || "-"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-left">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setFormOpen(true) }}>
                            <Edit className="size-4 text-muted-foreground" />
                          </Button>
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
        <ConsumerForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) window.location.reload()
          }}
          initialData={editingItem}
        />
      )}
    </div>
  )
}
