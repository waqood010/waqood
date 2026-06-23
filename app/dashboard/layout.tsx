import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { TopBar } from "@/components/dashboard/top-bar"

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

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex w-full min-h-svh bg-secondary/20">
        <AppSidebar role={role} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar userName={session.user.name} role={role} />
          <main className="flex-1 p-6 lg:p-8 overflow-auto w-full max-w-[1400px] mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
