"use client"

import React, { useState } from "react"
import { StationForm } from "./station-form"
import { TanksSection } from "./tanks-section"
import { deleteStation } from "@/app/dashboard/stations/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, ChevronDown, ChevronUp, Search, Plus, Building2 } from "lucide-react"
import { toast } from "sonner"
import { confirmModal } from "@/components/ui/confirm"

export function StationsTable({ initialStations, fuelTypes, isAdmin }: { initialStations: any[], fuelTypes: any[], isAdmin: boolean }) {
  const [stations, setStations] = useState(initialStations)
  const [search, setSearch] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  
  const [formOpen, setFormOpen] = useState(false)
  const [editingStation, setEditingStation] = useState<any>(null)

  const toggleRow = (id: number) => {
    const newSet = new Set(expandedRows)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedRows(newSet)
  }

  const handleDelete = async (id: number) => {
    if (!(await confirmModal("هل أنت متأكد من حذف هذه المحطة؟ تأكد أولاً من حذف جميع خزاناتها."))) return
    try {
      await deleteStation(id)
      setStations(stations.filter(s => s.id !== id))
      toast.success("تم حذف المحطة")
    } catch (err: any) {
      toast.error(err.message || "فشل في حذف المحطة")
    }
  }

  const filteredStations = stations.filter(s => s.name.includes(search))

  // Calculate tank stats for each station
  const getStationTankStats = (station: any) => {
    let totalCapacity = 0
    let totalCurrent = 0

    if (station.tanks && Array.isArray(station.tanks)) {
      station.tanks.forEach((tank: any) => {
        totalCapacity += tank.capacityLiter || 0
        totalCurrent += tank.currentBalance || 0
      })
    }

    return {
      totalCapacity,
      totalCurrent,
      totalEmpty: totalCapacity - totalCurrent,
      tankCount: station.tanks?.length || 0
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="بحث عن محطة..." 
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingStation(null); setFormOpen(true) }}>
            <Plus className="ml-2 size-4" /> إضافة محطة
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium w-10"></th>
                <th className="px-4 py-3 font-medium">اسم المحطة</th>
                <th className="px-4 py-3 font-medium">ملاحظات</th>
                <th className="px-4 py-3 font-medium text-center">الخزانات</th>
                <th className="px-4 py-3 font-medium text-center">اجمالي سعة الخزانات</th>
                <th className="px-4 py-3 font-medium text-center">اجمالي الكمية الموجودة</th>
                <th className="px-4 py-3 font-medium text-center">اجمالي الفارغ</th>
                {isAdmin && <th className="px-4 py-3 font-medium text-left">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد محطات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredStations.map((station) => (
                  <React.Fragment key={station.id}>
                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8"
                          onClick={() => toggleRow(station.id)}
                        >
                          {expandedRows.has(station.id) ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                      </td>
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <Building2 className="size-4 text-primary" />
                        {station.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {station.notes || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium min-w-8">
                          {getStationTankStats(station).tankCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="font-semibold">{getStationTankStats(station).totalCapacity.toLocaleString()}</span>
                        <span className="text-muted-foreground text-xs ml-1">لتر</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{getStationTankStats(station).totalCurrent.toLocaleString()}</span>
                        <span className="text-muted-foreground text-xs ml-1">لتر</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{getStationTankStats(station).totalEmpty.toLocaleString()}</span>
                        <span className="text-muted-foreground text-xs ml-1">لتر</span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-left">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingStation(station); setFormOpen(true) }}>
                              <Edit className="size-4 text-muted-foreground" />
                            </Button>
                            <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(station.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedRows.has(station.id) && (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} className="p-0 border-b-0 bg-secondary/5">
                          <TanksSection stationId={station.id} fuelTypes={fuelTypes} isAdmin={isAdmin} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <StationForm 
          open={formOpen} 
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) window.location.reload() // simple refresh to get updated data
          }} 
          initialData={editingStation} 
        />
      )}
    </div>
  )
}

