"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/accreditation/StatusBadge"
import { ZoneBadge } from "@/components/accreditation/ZoneBadge"
import { GroupTypeBadge } from "@/components/accreditation/RoleBadge"
import type {
  Person,
  Group,
  Zone,
  ItemType,
  PersonItem,
  PersonStatus,
} from "@/types/accreditation"
import { PersonDetailDrawer } from "./PersonDetailDrawer"

type EnrichedPerson = Omit<Person, "items"> & {
  items: PersonItem[]
  group: Group
  zones: Zone[]
  itemDetails: Array<PersonItem & { type: ItemType }>
}

const STATUS_FILTERS: Array<{ key: "all" | PersonStatus; label: string }> = [
  { key: "all", label: "Alle" },
  { key: "draft", label: "Pending" },
  { key: "approved", label: "Goedgekeurd" },
  { key: "checked_in", label: "Ingecheckt" },
  { key: "checked_out", label: "Uitgecheckt" },
]

export function PersonsList({
  persons,
  groups,
  allDays,
}: {
  persons: EnrichedPerson[]
  groups: Group[]
  allDays: string[]
}) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | PersonStatus>("all")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = persons.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q) ||
      p.group.name.toLowerCase().includes(q)
    )
  })

  const grouped = groups
    .map((group) => ({
      group,
      persons: filtered.filter((p) => p.group_id === group.id),
    }))
    .filter((g) => g.persons.length > 0)

  const selected = persons.find((p) => p.id === selectedId) ?? null

  return (
    <>
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op naam, e-mail, rol of groep…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === f.key
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Geen personen gevonden voor deze filters.
          </div>
        ) : (
          <ul className="divide-y">
            {grouped.map(({ group, persons: ps }) => {
              const isCollapsed = collapsed[group.id]
              return (
                <li key={group.id}>
                  <button
                    onClick={() =>
                      setCollapsed((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                    }
                    className="flex w-full items-center justify-between gap-3 bg-zinc-50/50 px-4 py-2.5 text-left transition-colors hover:bg-zinc-100/70"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{group.name}</span>
                      <GroupTypeBadge type={group.type} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {ps.length}{" "}
                        {group.max_persons ? `/ ${group.max_persons}` : ""} personen
                      </span>
                    </div>
                  </button>

                  {!isCollapsed && (
                    <ul className="divide-y">
                      {ps.map((p) => (
                        <li key={p.id}>
                          <button
                            onClick={() => setSelectedId(p.id)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                                {p.first_name[0]}
                                {p.last_name[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-medium">
                                    {p.first_name} {p.last_name}
                                  </span>
                                  {p.role ? (
                                    <span className="truncate text-xs text-muted-foreground">
                                      · {p.role}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  {p.zones.slice(0, 4).map((z) => (
                                    <ZoneBadge
                                      key={z.id}
                                      name={z.name}
                                      color={z.color}
                                    />
                                  ))}
                                  {p.zones.length > 4 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      +{p.zones.length - 4}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <span className="hidden text-xs text-muted-foreground md:inline-block">
                                {p.approved_days.length > 0
                                  ? `${p.approved_days.length}/${p.valid_days.length} dagen`
                                  : `${p.valid_days.length} dagen`}
                              </span>
                              <StatusBadge status={p.status} />
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <PersonDetailDrawer
        person={selected}
        allDays={allDays}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}
