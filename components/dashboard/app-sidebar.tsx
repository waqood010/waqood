"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, LogOut, Loader2 } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { navGroups } from "@/lib/navigation"
import { authClient } from "@/lib/auth-client"

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const [loadingHref, setLoadingHref] = React.useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  React.useEffect(() => {
    setLoadingHref(null)
  }, [pathname])

  return (
    <Sidebar side="right" variant="sidebar" collapsible="icon" dir="rtl">
      <SidebarHeader className="border-b border-border/50 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none px-2 text-right w-full overflow-hidden">
                <span className="font-semibold text-base truncate">جهاز النقل</span>
                <span className="text-xs text-muted-foreground truncate">إدارة الوقود والزيوت</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 gap-6">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || role === "admin"
          )

          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.label} className="pt-0">
              <SidebarGroupLabel className="text-right flex items-center justify-end px-2 mb-2 text-xs font-semibold text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    const isLoading = loadingHref === item.href
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} className="flex items-center w-full" />}
                          isActive={isActive}
                          tooltip={item.title}
                          className="h-10 text-right justify-end gap-3"
                          onClick={() => {
                            if (pathname !== item.href) {
                              setLoadingHref(item.href)
                            }
                          }}
                        >
                          <span className="font-medium flex-1 text-right">{item.title}</span>
                          <span className="w-7 flex items-center justify-center shrink-0">
                            {isLoading ? (
                              <Loader2 className="size-4 animate-spin text-primary" />
                            ) : (
                              <item.icon className="size-4 opacity-70" />
                            )}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="تسجيل الخروج"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-10 gap-3 justify-end text-right"
              disabled={isSigningOut}
              onClick={async () => {
                setIsSigningOut(true)
                try {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/sign-in"
                      },
                    },
                  })
                } catch (e) {
                  setIsSigningOut(false)
                }
              }}
            >
              <span className="font-medium flex-1 text-right">تسجيل الخروج</span>
              <span className="w-7 flex items-center justify-center shrink-0">
                {isSigningOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
