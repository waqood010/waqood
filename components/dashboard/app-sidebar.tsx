"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, LogOut } from "lucide-react"

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

  return (
    <Sidebar side="right" variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-border/50 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
          // Filter out items the user shouldn't see
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || role === "admin"
          )

          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.label} className="pt-0">
              <SidebarGroupLabel className="text-right flex items-center px-2 mb-2 text-xs font-semibold text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className="h-10 text-right justify-start gap-3 flex-row-reverse"
                        >
                          <Link href={item.href}>
                            <item.icon className="size-4 opacity-70" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
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
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-10 gap-3 justify-start flex-row-reverse text-right"
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/sign-in"
                    },
                  },
                })
              }}
            >
              <LogOut className="size-4" />
              <span className="font-medium">تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
