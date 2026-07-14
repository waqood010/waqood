import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { getTaskNotificationCount } from "@/app/dashboard/tasks/actions"
import { db } from "@/lib/db"
import { alerts } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Middleware should catch this, but double checking
  if (!session?.user) {
    redirect("/sign-in")
  }

  const role = session.user.role as string
  const [alertCountResult, taskCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(alerts).where(eq(alerts.isRead, false)),
    getTaskNotificationCount(),
  ])
  const unreadAlerts = Number(alertCountResult[0]?.count || 0)
  const notificationCount = unreadAlerts + Number(taskCount || 0)

  return (
    <SidebarProvider defaultOpen={true}>
      <div dir="rtl" className="flex w-full min-h-svh bg-secondary/20">
        <AppSidebar role={role} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar userName={session.user.name} role={role} notificationCount={notificationCount} />
          <main className="flex-1 p-6 lg:p-8 overflow-auto w-full max-w-[1400px] mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
