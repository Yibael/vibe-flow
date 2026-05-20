"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3Icon,
  DatabaseIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/design",
    label: "看板",
    icon: LayoutDashboardIcon,
  },
  {
    href: "/design/accounts",
    label: "资产管理",
    icon: LandmarkIcon,
  },
  {
    href: "/design/snapshots",
    label: "快照管理",
    icon: DatabaseIcon,
  },
]

export function DesignShell({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Link href="/design" className="flex min-w-0 items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <BarChart3Icon />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">个人净值</div>
                <div className="truncate text-xs text-muted-foreground">
                  UI/UX 原型
                </div>
              </div>
            </Link>
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const active =
                  item.href === "/design"
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Button
                    key={item.href}
                    asChild
                    size="sm"
                    variant={active ? "default" : "outline"}
                  >
                    <Link href={item.href}>
                      <Icon data-icon="inline-start" />
                      {item.label}
                    </Link>
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          {actions ? (
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 md:justify-end"
              )}
            >
              {actions}
            </div>
          ) : null}
        </section>
        <Separator />
        {children}
      </div>
    </main>
  )
}

