import {
  LayoutDashboard,
  Fuel,
  Building2,
  TruckIcon,
  Droplets,
  PackagePlus,
  Users,
  Gauge,
  HandCoins,
  BarChart3,
  Bell,
  Settings,
  History,
  ClipboardList,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: "الرئيسية",
    items: [{ title: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "إدارة الوقود",
    items: [
      { title: "المحطات", href: "/dashboard/stations", icon: Building2 },
      { title: "وارد الوقود", href: "/dashboard/fuel-supplies", icon: TruckIcon },
      { title: "استهلاك الوقود", href: "/dashboard/fuel-consumption", icon: Fuel },
    ],
  },
  {
    label: "إدارة الزيوت",
    items: [
      { title: "أصناف الزيوت", href: "/dashboard/oils", icon: Droplets },
      { title: "توريدات الزيوت", href: "/dashboard/oil-supplies", icon: PackagePlus },
      { title: "تحليل العينات", href: "/dashboard/oil-sample-analysis", icon: BarChart3 },
      { title: "الجهات المستهلكة ومعدلات الاستهلاك", href: "/dashboard/consumers", icon: Users },
      { title: "صرف الزيوت", href: "/dashboard/oil-transactions", icon: HandCoins },
    ],
  },
  {
    label: "النظام",
    items: [
      { title: "التنبيهات", href: "/dashboard/alerts", icon: Bell },
      { title: "قائمة المهام", href: "/dashboard/tasks", icon: ClipboardList },
      { title: "سجل العمليات", href: "/dashboard/audit-log", icon: History, adminOnly: true },
      { title: "الإعدادات", href: "/dashboard/settings", icon: Settings, adminOnly: true },
    ],
  },
]

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items)
