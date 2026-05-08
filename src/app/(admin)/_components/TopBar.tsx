"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ExternalLink, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { accreditationActions } from "@/lib/store/accreditation-store"

const TITLES: Record<string, string> = {
  "/companies": "Bedrijven",
  "/crew": "Crew",
  "/approvals": "Approvals",
  "/checkin": "Check-in",
  "/redeem": "Maaltijd-uitgifte",
  "/days": "Project dagen",
  "/zones": "Zones",
  "/items": "Items",
  "/briefings": "Briefings",
  "/reports": "Reports",
  "/settings": "Instellingen",
}

export function TopBar() {
  const pathname = usePathname() ?? "/"
  // Resolve title for current route prefix
  let title = "Dashboard"
  for (const [prefix, t] of Object.entries(TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      title = t
      break
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (
              confirm(
                "Reset alle wijzigingen en herlaad de seed data? Dit kan niet ongedaan worden."
              )
            ) {
              accreditationActions.reset()
            }
          }}
          title="Reset prototype data"
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden sm:inline">Reset demo</span>
        </Button>
      </div>
    </header>
  )
}
