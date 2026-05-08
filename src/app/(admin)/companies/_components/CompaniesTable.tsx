"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  LayoutGrid,
  List,
  Mail,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { GroupTypeBadge } from "@/components/accreditation/RoleBadge"
import type { GroupType } from "@/types/accreditation"

export type CompanyRow = {
  id: string
  name: string
  type: GroupType
  contact_name?: string
  contact_email?: string
  max_persons?: number
  total: number
  pending: number
  approved: number
  checked_in: number
  invite_token: string
}

type SortKey = "name" | "type" | "total" | "pending" | "approved"
type SortDir = "asc" | "desc"

const TYPE_FILTERS: Array<{ key: "all" | GroupType; label: string }> = [
  { key: "all", label: "Alle" },
  { key: "crew", label: "Crew" },
  { key: "artist", label: "Artiest" },
  { key: "supplier", label: "Leverancier" },
  { key: "press", label: "Pers" },
  { key: "vip", label: "VIP" },
  { key: "other", label: "Overig" },
]

export function CompaniesTable({
  rows,
  projectId,
}: {
  rows: CompanyRow[]
  projectId: string
}) {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | GroupType>("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [view, setView] = useState<"table" | "cards">("table")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((r) => {
        if (typeFilter !== "all" && r.type !== typeFilter) return false
        if (!q) return true
        return (
          r.name.toLowerCase().includes(q) ||
          r.contact_name?.toLowerCase().includes(q) ||
          r.contact_email?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1
        switch (sortKey) {
          case "name":
            return a.name.localeCompare(b.name) * dir
          case "type":
            return a.type.localeCompare(b.type) * dir
          case "total":
            return (a.total - b.total) * dir
          case "pending":
            return (a.pending - b.pending) * dir
          case "approved":
            return (a.approved - b.approved) * dir
        }
      })
  }, [rows, query, typeFilter, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(k)
      setSortDir(k === "name" || k === "type" ? "asc" : "desc")
    }
  }

  return (
    <section className="rounded-xl border bg-card shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek bedrijf, contact of e-mail…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  typeFilter === f.key
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-md border bg-white p-0.5">
            <button
              onClick={() => setView("table")}
              className={cn(
                "rounded p-1 transition-colors",
                view === "table"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
              aria-label="Tabel"
            >
              <List className="size-3.5" />
            </button>
            <button
              onClick={() => setView("cards")}
              className={cn(
                "rounded p-1 transition-colors",
                view === "cards"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
              aria-label="Kaarten"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Geen bedrijven gevonden.
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50/50 text-xs">
              <tr className="border-b">
                <SortHead
                  active={sortKey === "name"}
                  dir={sortDir}
                  onClick={() => toggleSort("name")}
                  className="text-left"
                >
                  Bedrijf
                </SortHead>
                <SortHead
                  active={sortKey === "type"}
                  dir={sortDir}
                  onClick={() => toggleSort("type")}
                  className="hidden text-left md:table-cell"
                >
                  Type
                </SortHead>
                <th className="hidden p-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Contact
                </th>
                <SortHead
                  active={sortKey === "total"}
                  dir={sortDir}
                  onClick={() => toggleSort("total")}
                  className="text-right"
                >
                  Crew
                </SortHead>
                <SortHead
                  active={sortKey === "pending"}
                  dir={sortDir}
                  onClick={() => toggleSort("pending")}
                  className="text-right"
                >
                  Pending
                </SortHead>
                <SortHead
                  active={sortKey === "approved"}
                  dir={sortDir}
                  onClick={() => toggleSort("approved")}
                  className="text-right"
                >
                  Goedgekeurd
                </SortHead>
                <th className="w-8 p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="group cursor-pointer transition-colors hover:bg-zinc-50"
                >
                  <td className="p-3">
                    <Link
                      href={`/companies/${r.id}`}
                      className="block font-medium tracking-tight"
                    >
                      {r.name}
                    </Link>
                    <div className="text-xs text-muted-foreground md:hidden">
                      <GroupTypeBadge type={r.type} />
                    </div>
                  </td>
                  <td className="hidden p-3 md:table-cell">
                    <GroupTypeBadge type={r.type} />
                  </td>
                  <td className="hidden p-3 lg:table-cell">
                    <div className="text-xs">{r.contact_name ?? "—"}</div>
                    {r.contact_email && (
                      <a
                        href={`mailto:${r.contact_email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <Mail className="size-3" />
                        {r.contact_email}
                      </a>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    <span className="font-medium">{r.total}</span>
                    {r.max_persons ? (
                      <span className="text-muted-foreground">
                        {" "}
                        / {r.max_persons}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {r.pending > 0 ? (
                      <Link
                        href={`/approvals`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 hover:bg-amber-200"
                      >
                        {r.pending}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    <span
                      className={cn(
                        "font-medium",
                        r.approved > 0 ? "text-emerald-700" : "text-muted-foreground"
                      )}
                    >
                      {r.approved}
                    </span>
                    {r.checked_in > 0 && (
                      <span className="ml-1 text-xs text-blue-700">
                        ({r.checked_in} in)
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/companies/${r.id}`}
                      className="flex items-center justify-end text-zinc-300 transition-colors group-hover:text-foreground"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50/50 text-xs text-muted-foreground">
              <tr className="border-t">
                <td className="p-2" colSpan={3}>
                  {filtered.length} van {rows.length} bedrijven
                </td>
                <td className="p-2 text-right tabular-nums">
                  <strong>{filtered.reduce((s, r) => s + r.total, 0)}</strong>
                </td>
                <td className="p-2 text-right tabular-nums">
                  <strong className="text-amber-700">
                    {filtered.reduce((s, r) => s + r.pending, 0)}
                  </strong>
                </td>
                <td className="p-2 text-right tabular-nums">
                  <strong className="text-emerald-700">
                    {filtered.reduce((s, r) => s + r.approved, 0)}
                  </strong>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-2">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/companies/${r.id}`}
              className="group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold tracking-tight">
                      {r.name}
                    </h3>
                    <GroupTypeBadge type={r.type} />
                  </div>
                  {r.contact_name && (
                    <p className="text-xs text-muted-foreground">
                      {r.contact_name}
                    </p>
                  )}
                  {r.contact_email && (
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      {r.contact_email}
                    </p>
                  )}
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="Crew" value={`${r.total}${r.max_persons ? `/${r.max_persons}` : ""}`} />
                <Stat label="Pending" value={r.pending} tone={r.pending > 0 ? "amber" : "muted"} />
                <Stat label="Goedgekeurd" value={r.approved} tone="emerald" />
              </div>
              <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ExternalLink className="size-3" />
                  Publieke link
                </span>
                <span className="font-medium text-foreground">
                  Beheer crew →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function SortHead({
  active,
  dir,
  onClick,
  className,
  children,
}: {
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "cursor-pointer select-none p-3 font-medium text-muted-foreground transition-colors hover:bg-zinc-100/60 hover:text-foreground",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-30" />
        )}
      </span>
    </th>
  )
}

function Stat({
  label,
  value,
  tone = "muted",
}: {
  label: string
  value: string | number
  tone?: "muted" | "amber" | "emerald"
}) {
  const toneCls =
    tone === "amber"
      ? "text-amber-700"
      : tone === "emerald"
      ? "text-emerald-700"
      : "text-foreground"
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-lg font-semibold tabular-nums", toneCls)}>
        {value}
      </div>
    </div>
  )
}
