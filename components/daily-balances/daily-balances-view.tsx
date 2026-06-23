"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Printer, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function DailyBalancesView({ 
  initialData, 
  targetDate 
}: { 
  initialData: any[], 
  targetDate: string 
}) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")

  const filteredData = data.filter((d) =>
    d.stationName.includes(search) ||
    d.tankName.includes(search) ||
    d.fuelTypeName.includes(search)
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 print:hidden">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن محطة، خزان، وقود..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {/* A form to change the date, submitting reloads the page with ?date=YYYY-MM-DD */}
          <form method="GET" className="flex gap-2">
            <div className="relative">
              <Input 
                name="date" 
                type="date" 
                defaultValue={targetDate} 
                className="w-auto"
              />
            </div>
            <Button type="submit" variant="secondary">
              تحديث
            </Button>
          </form>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="ml-2 size-4" /> طباعة التقرير
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right print:text-[11px]">
            <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">المحطة</th>
                <th className="px-4 py-3 font-medium">الخزان</th>
                <th className="px-4 py-3 font-medium">نوع الوقود</th>
                <th className="px-4 py-3 font-medium text-center border-r border-border/50">رصيد أول</th>
                <th className="px-4 py-3 font-medium text-center text-primary">إجمالي الوارد</th>
                <th className="px-4 py-3 font-medium text-center text-destructive">إجمالي المصروف</th>
                <th className="px-4 py-3 font-medium text-center border-x border-border/50 bg-secondary/30">الرصيد النظري</th>
                <th className="px-4 py-3 font-medium text-center font-bold">الرصيد الفعلي</th>
                <th className="px-4 py-3 font-medium text-center">الفرق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد بيانات للعرض
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={`${row.tankId}-${idx}`} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{row.stationName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.tankName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                        {row.fuelTypeName}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-center border-r border-border/50" dir="ltr">
                      {row.openingBalance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-primary font-medium" dir="ltr">
                      {row.totalSupply > 0 ? `+ ${row.totalSupply.toLocaleString()}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-destructive font-medium" dir="ltr">
                      {row.totalConsumption > 0 ? `- ${row.totalConsumption.toLocaleString()}` : "-"}
                    </td>
                    
                    <td className="px-4 py-3 text-center border-x border-border/50 bg-secondary/10 font-medium" dir="ltr">
                      {row.theoreticalClosing.toLocaleString()}
                    </td>
                    
                    <td className="px-4 py-3 text-center" dir="ltr">
                      {row.actualClosing !== null ? (
                        <span className="font-bold">{row.actualClosing.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">لم يسجل</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 text-center" dir="ltr">
                      {row.difference !== null ? (
                        <span className={cn(
                          "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold min-w-16",
                          row.status === "matched" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          row.status === "acceptable" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {row.difference > 0 ? "+" : ""}{row.difference.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md text-sm flex gap-2 items-start">
          <div className="mt-0.5">✅</div>
          <div>
            <strong>مطابق:</strong> لا يوجد فرق بين الرصيد النظري والقياس الفعلي للخزان.
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm flex gap-2 items-start">
          <div className="mt-0.5">⚠️</div>
          <div>
            <strong>مقبول:</strong> يوجد فرق بسيط يقع ضمن نسبة السماح المقررة (± 100 لتر).
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm flex gap-2 items-start">
          <div className="mt-0.5">🔴</div>
          <div>
            <strong>مراجعة:</strong> يوجد فرق كبير يتجاوز نسبة السماح ويستدعي المراجعة الفورية.
          </div>
        </div>
      </div>
    </div>
  )
}
