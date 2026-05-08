"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  Inbox,
  ScanLine,
  Calendar,
  MapPin,
  Package,
  ShieldAlert,
  BarChart3,
  Home,
  Settings,
  UtensilsCrossed,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePersons, useProject } from "@/lib/store/accreditation-store"

type NavItem =
  | {
      kind: "link"
      href: string
      label: string
      icon: React.ComponentType<{ className?: string }>
      badge?: "pending"
    }
  | { kind: "section"; label: string }

const NAV: NavItem[] = [
  { kind: "link", href: "/companies", label: "Bedrijven", icon: Building2 },
  { kind: "link", href: "/crew", label: "Crew", icon: Users },
  {
    kind: "link",
    href: "/approvals",
    label: "Approvals",
    icon: Inbox,
    badge: "pending",
  },
  { kind: "link", href: "/checkin", label: "Check-in", icon: ScanLine },
  {
    kind: "link",
    href: "/redeem",
    label: "Maaltijd-uitgifte",
    icon: UtensilsCrossed,
  },
  { kind: "section", label: "Project setup" },
  { kind: "link", href: "/days", label: "Dagen", icon: Calendar },
  { kind: "link", href: "/zones", label: "Zones", icon: MapPin },
  { kind: "link", href: "/items", label: "Items", icon: Package },
  { kind: "link", href: "/briefings", label: "Briefings", icon: ShieldAlert },
  { kind: "section", label: "Rapportage" },
  { kind: "link", href: "/reports", label: "Reports", icon: BarChart3 },
  { kind: "section", label: "Beheer" },
  { kind: "link", href: "/settings", label: "Instellingen", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const persons = usePersons()
  const project = useProject()
  const pendingCount = persons.filter((p) => p.status === "draft").length

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-white md:flex">
      {/* Project header */}
      <div className="border-b px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-zinc-900 text-white">
            <Home className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              IMS · Accreditatie
            </p>
            <p className="truncate text-sm font-semibold leading-tight">
              {project.name}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {NAV.map((item, i) => {
            if (item.kind === "section") {
              return (
                <li
                  key={`s-${i}`}
                  className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {item.label}
                </li>
              )
            }
            const active =
              pathname === item.href ||
              (pathname?.startsWith(item.href + "/") ?? false)
            const Icon = item.icon
            const showBadge = item.badge === "pending" && pendingCount > 0
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {showBadge && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <footer className="border-t px-4 py-3 text-[10px] text-muted-foreground">
        <p>Prototype — geen live database</p>
        <p className="mt-0.5">
          {persons.length} crew · {project.show_days.length} showdagen
        </p>
      </footer>
    </aside>
  )
}
