import { getSession } from "@/lib/session"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Flame, Droplets, Building2, Container, AlertTriangle } from "lucide-react"

export default async function DashboardPage() {
  const session = await getSession()
  const role = session?.user?.role || "user"
  const isAdmin = role === "admin"

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">نظرة عامة</h2>
        <p className="text-muted-foreground">
          ملخص لبيانات الوقود والزيوت وحالة المحطات والتنبيهات.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الوقود المتاح"
          value="45,200 لتر"
          icon={Flame}
          description="مجموع الرصيد الحالي بجميع الخزانات"
          iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-500"
        />
        <StatCard
          title="إجمالي مخزون الزيوت"
          value="1,450 عبوة"
          icon={Droplets}
          description="جميع أصناف الزيوت المتاحة"
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-500"
        />
        <StatCard
          title="عدد المحطات"
          value="12 محطة"
          icon={Building2}
        />
        <StatCard
          title="التنبيهات النشطة"
          value="3 تنبيهات"
          icon={AlertTriangle}
          description="2 مرتفع، 1 متوسط"
          iconClassName="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>معدلات الاستهلاك الشهري</CardTitle>
            <CardDescription>مقارنة بين استهلاك الوقود والزيوت خلال العام الحالي</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-secondary/10 rounded-md mx-6 mb-6 border border-dashed">
            <span className="text-muted-foreground">رسم بياني للاستهلاك</span>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>أحدث التنبيهات</CardTitle>
            <CardDescription>الخزانات والأصناف التي تتطلب انتباه</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "انخفاض رصيد بنزين 92", desc: "خزان رقم 3 بمحطة المركز الرئيسي", time: "قبل ساعة" },
                { title: "نفاد وشيك لزيت المحركات", desc: "الرصيد أقل من الحد الأدنى بـ 15 عبوة", time: "قبل 3 ساعات" },
                { title: "فرق قياس غير مقبول", desc: "خزان سولار محطة الشمال (+150 لتر)", time: "أمس" },
              ].map((alert, i) => (
                <div key={i} className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="mt-0.5 rounded-full bg-destructive/10 p-1.5">
                    <AlertTriangle className="size-4 text-destructive" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.desc}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{alert.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>أحدث العمليات</CardTitle>
            <CardDescription>سجل أحدث حركات التوريد والصرف والاستهلاك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center bg-secondary/10 rounded-md border border-dashed">
              <span className="text-muted-foreground">جدول العمليات الأخيرة</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
