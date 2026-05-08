"use client"

import { useMemo } from "react"
import {
  usePersons,
  useGroups,
  useZones,
  useItemTypes,
} from "@/lib/store/accreditation-store"
import { CheckinClient } from "./CheckinClient"

export function CheckinPageClient({ today }: { today: string }) {
  const persons = usePersons()
  const groups = useGroups()
  const zones = useZones()
  const itemTypes = useItemTypes()

  const personsToday = useMemo(
    () =>
      persons
        .filter(
          (p) =>
            ["approved", "checked_in", "checked_out"].includes(p.status) &&
            p.approved_days.includes(today)
        )
        .map((p) => ({
          ...p,
          group: groups.find((g) => g.id === p.group_id)!,
          zones: zones.filter((z) => p.zone_ids.includes(z.id)),
          items: p.items.map((it) => ({
            ...it,
            type: itemTypes.find((t) => t.id === it.item_type_id)!,
          })),
        })),
    [persons, groups, zones, itemTypes, today]
  )

  return <CheckinClient persons={personsToday} today={today} />
}
