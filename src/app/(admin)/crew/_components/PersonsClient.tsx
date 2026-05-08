"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/accreditation/StatCard"
import { PersonsList } from "./PersonsList"
import {
  usePersons,
  useGroups,
  useZones,
  useItemTypes,
} from "@/lib/store/accreditation-store"
import { PROJECT, dayLabel } from "@/lib/mock/data"

export function PersonsClient({
  allDays,
  seedBriefingsCount,
}: {
  allDays: string[]
  seedGroupsCount: number
  seedBriefingsCount: number
}) {
  const persons = usePersons()
  const groups = useGroups()
  const zones = useZones()
  const itemTypes = useItemTypes()

  const stats = useMemo(() => {
    const total = persons.length
    const draft = persons.filter((p) => p.status === "draft").length
    const approved = persons.filter((p) =>
      ["approved", "checked_in", "checked_out"].includes(p.status)
    ).length
    const checkedIn = persons.filter((p) => p.status === "checked_in").length
    const peakDay = allDays
      .map((day) => ({
        day,
        n: persons.filter((p) => p.approved_days.includes(day)).length,
      }))
      .sort((a, b) => b.n - a.n)[0]
    return { total, draft, approved, checkedIn, peakDay }
  }, [persons, allDays])

  const enriched = useMemo(
    () =>
      persons.map((p) => ({
        ...p,
        group: groups.find((g) => g.id === p.group_id)!,
        zones: zones.filter((z) => p.zone_ids.includes(z.id)),
        itemDetails: p.items
          .map((it) => {
            const type = itemTypes.find((t) => t.id === it.item_type_id)
            return type ? { ...it, type } : null
          })
          .filter(Boolean) as Array<
          (typeof persons)[0]["items"][0] & {
            type: (typeof itemTypes)[0]
          }
        >,
      })),
    [persons, groups, zones, itemTypes]
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard
          label="Crew totaal"
          value={stats.total}
          delta={`${stats.approved} goedgekeurd`}
        />
        <StatCard
          label="In behandeling"
          value={stats.draft}
          variant={stats.draft > 0 ? "highlight" : "default"}
          href={`/approvals`}
          delta={stats.draft > 0 ? "Klik om te beoordelen" : "Geen pending"}
        />
        <StatCard
          label="Ingecheckt nu"
          value={stats.checkedIn}
          delta={
            stats.checkedIn > 0 && stats.approved > 0
              ? `${Math.round((stats.checkedIn / stats.approved) * 100)}% van approved`
              : "—"
          }
        />
        <StatCard
          label="Drukste dag"
          value={stats.peakDay ? stats.peakDay.n : 0}
          delta={stats.peakDay ? dayLabel(stats.peakDay.day) : "—"}
        />
        <StatCard
          label="Bedrijven"
          value={groups.length}
          delta={`${seedBriefingsCount} briefings`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Crew</h2>
          <p className="text-sm text-muted-foreground">
            Gegroepeerd per bedrijf. Klik een persoon voor details en goedkeuren.
          </p>
        </div>
        <Button asChild>
          <Link href="/companies">
            <Plus className="size-4" />
            Persoon toevoegen
          </Link>
        </Button>
      </div>

      <PersonsList persons={enriched} groups={groups} allDays={allDays} />
    </div>
  )
}
