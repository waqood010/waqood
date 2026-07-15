import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm font-medium">جارٍ تحميل الصفحة...</p>
    </div>
  )
}