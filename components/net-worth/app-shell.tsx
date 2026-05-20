"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3Icon, DatabaseIcon, LandmarkIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "看板", icon: BarChart3Icon },
  { href: "/accounts", label: "资产管理", icon: LandmarkIcon },
  { href: "/snapshots", label: "快照管理", icon: DatabaseIcon },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-base font-semibold">
            个人净值
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("justify-start", isActive && "font-semibold")}
                  >
                    <Link href={item.href}>
                      <Icon data-icon="inline-start" />
                      {item.label}
                    </Link>
                  </Button>
                )
              })}
            </nav>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="切换主题"
            >
              {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
          </div>
        </div>
        <Separator />
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
