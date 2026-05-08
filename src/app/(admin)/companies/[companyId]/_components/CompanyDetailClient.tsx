"use client"

import { useMemo } from "react"
import { notFound } from "next/navigation"
import {
  useGroup,
  usePersons,
  useZones,
  useItemTypes,
} from "@/lib/store/accreditation-store"
import { CompanyCrewView } from "./CompanyCrewView"
import type { Project } from "@/types/accreditation"

export function CompanyDetailClient({
  companyId,
  allDays,
  project,
}: {
  companyId: string
  allDays: string[]
  project: Project
}) {
  const company = useGroup(companyId)
  const persons = usePersons()
  const zones = useZones()
  const itemTypes = useItemTypes()

  const crew = useMemo(
    () =>
      persons
        .filter((p) => p.group_id === companyId)
        .map((p) => ({
          ...p,
          zones: zones.filter((z) => p.zone_ids.includes(z.id)),
          items: p.items.map((it) => ({
            ...it,
            type: itemTypes.find((t) => t.id === it.item_type_id)!,
          })),
        })),
    [persons, zones, itemTypes, companyId]
  )

  if (!company) {
    notFound()
  }

  return (
    <CompanyCrewView
      company={company}
      crew={crew}
      allDays={allDays}
      zones={zones}
      itemTypes={itemTypes}
      project={project}
    />
  )
}
