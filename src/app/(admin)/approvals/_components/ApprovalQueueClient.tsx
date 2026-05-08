"use client"

import { useMemo } from "react"
import {
  usePersons,
  useGroups,
  useZones,
  useItemTypes,
} from "@/lib/store/accreditation-store"
import { ApprovalQueue } from "./ApprovalQueue"

export function ApprovalQueueClient({ allDays }: { allDays: string[] }) {
  const persons = usePersons()
  const groups = useGroups()
  const zones = useZones()
  const itemTypes = useItemTypes()

  const pending = useMemo(
    () =>
      persons
        .filter((p) => p.status === "draft")
        .map((p) => ({
          ...p,
          group: groups.find((g) => g.id === p.group_id)!,
          zones: zones.filter((z) => p.zone_ids.includes(z.id)),
          items: p.items.map((it) => ({
            ...it,
            type: itemTypes.find((t) => t.id === it.item_type_id)!,
          })),
        })),
    [persons, groups, zones, itemTypes]
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Approval queue</h2>
        <p className="text-sm text-muted-foreground">
          {pending.length} personen wachten op beoordeling. Gebruik{" "}
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">J</kbd>/
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">K</kbd>{" "}
          om te navigeren,{" "}
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">A</kbd>{" "}
          om goed te keuren,{" "}
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">R</kbd>{" "}
          om af te wijzen.
        </p>
      </div>
      <ApprovalQueue queue={pending} allDays={allDays} />
    </div>
  )
}
