import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  breakdown?: Array<{ label: string; value: string }>
  className?: string
  iconClassName?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  breakdown,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border/50 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary", iconClassName)}>
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        
        {(description || trend) && (
          <div className="mt-1 flex items-center text-xs text-muted-foreground gap-2">
            {trend && (
              <span
                className={cn(
                  "font-medium",
                  trend.isPositive ? "text-emerald-600" : "text-destructive"
                )}
                dir="ltr"
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
            {description && <span>{description}</span>}
            {trend?.label && <span>{trend.label}</span>}
          </div>
        )}

        {breakdown && breakdown.length > 0 && (
          <div className="mt-4 space-y-2 pt-2 border-t border-border/40">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
