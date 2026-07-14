"use client"

import { Bell } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { navGroups } from "@/lib/navigation"

export function TopBar({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname()

  // Find current page title based on pathname
  let pageTitle = "لوحة التحكم"
  for (const group of navGroups) {
    const item = group.items.find(
      (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
    )
    if (item) {
      pageTitle = item.title
      break
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/50 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <h1 className="text-lg font-bold tracking-tight">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/dashboard/alerts" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="size-5" />
          <span className="absolute right-0 top-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white">
            {/* TODO: render badge count from parent props when available */}
          </span>
          <span className="sr-only">التنبيهات</span>
        </Link>

        <div className="hidden md:flex flex-col text-left mr-4 pr-4 border-r border-border">
          <span className="text-sm font-semibold truncate leading-none mb-1">{userName}</span>
          <span className="text-xs text-muted-foreground truncate leading-none">
            {role !== "user" ? "مدير النظام" : "مستخدم"}
          </span>
        </div>
      </div>
    </header>
  )
}
