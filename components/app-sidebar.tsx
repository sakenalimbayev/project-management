"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  BarChart3,
  Building2,
  BookOpen,
  FileText,
  LayoutGrid,
  Map,
  MapPin,
  MoreVertical,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoginDialog } from "@/components/dialog/login-dialog"
import { cn } from "@/lib/utils"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

const registryNav: NavItem[] = [
  { title: "Проекты", url: "/", icon: LayoutGrid },
  { title: "Карта проектов", url: "#", icon: Map },
  { title: "Аналитика", url: "#", icon: BarChart3 },
  { title: "Отчеты", url: "#", icon: FileText },
]

const referenceNav: NavItem[] = [
  { title: "Государственные органы", url: "#", icon: Building2 },
  { title: "Регионы", url: "#", icon: MapPin },
  { title: "Пользователи", url: "#", icon: Users },
  { title: "Роли", url: "#", icon: ShieldCheck },
  { title: "Справочники", url: "#", icon: BookOpen },
]

const getInitials = (label: string) =>
  label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?"

type SidebarUser = {
  name: string | null
  email: string | null
  role: string | null
}

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="uppercase tracking-wide">{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = item.url !== "#" && pathname === item.url
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
                className={cn(
                  isActive && "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
                )}
              >
                <Link href={item.url}>
                  <item.icon className={cn(isActive && "text-blue-600")} />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar({
  user = null,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: SidebarUser | null }) {
  const router = useRouter()
  const pathname = usePathname()

  const displayName = user?.name || user?.email?.split("@")[0] || "Гость"
  const roleLabel = user?.role === "ADMIN" ? "Администратор" : "Участник"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center cursor-pointer gap-2" onClick={() => router.push('/')}>
          <Image src="/icon-logo.png" alt="Logo" width={36} height={36} />
          <h3 className="font-bold">Open Projects</h3>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Реестр проектов" items={registryNav} pathname={pathname} />
        <NavGroup label="Справочники" items={referenceNav} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 rounded-md p-2">
                <Avatar className="h-9 w-9 rounded-full">
                  <AvatarFallback className="rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <div className="truncate text-sm font-medium">{displayName}</div>
                  <div className="truncate text-xs text-muted-foreground">{roleLabel}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
                      aria-label="Меню пользователя"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Профиль</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>Выйти</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <div className="p-2 group-data-[collapsible=icon]:hidden">
            <LoginDialog />
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
