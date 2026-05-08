"use client"

import { useMemo, useState } from "react"
import { Plus, Lock, Pencil, Trash2, AlertCircle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GroupTypeBadge } from "@/components/accreditation/RoleBadge"
import { StatusBadge } from "@/components/accreditation/StatusBadge"
import {
  accreditationActions,
  useGroups,
  useItemTypes,
  usePersons,
  useZones,
} from "@/lib/store/accreditation-store"
import { CrewFormDialog } from "@/app/(admin)/companies/[companyId]/_components/CrewFormDialog"
import type { EnrichedCrew } from "@/app/(admin)/companies/[companyId]/_components/CompanyCrewView"
import type { Group, ItemType, Project } from "@/types/accreditation"

export function PortalCrewClient({
  inviteToken,
  allDays,
  project,
}: {
  inviteToken: string
  allDays: string[]
  project: Project
}) {
  const groups = useGroups()
  const persons = usePersons()
  const zones = useZones()
  const itemTypes = useItemTypes()

  const company = useMemo(
    () => groups.find((g) => g.invite_token === inviteToken),
    [groups, inviteToken]
  )

  const [editing, setEditing] = useState<EnrichedCrew | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [lastCreated, setLastCreated] = useState<EnrichedCrew | null>(null)

  const crew = useMemo(() => {
    if (!company) return []
    return persons
      .filter((p) => p.group_id === company.id)
      .map((p) => ({
        ...p,
        zones: zones.filter((z) => p.zone_ids.includes(z.id)),
        items: p.items.map((it) => ({
          ...it,
          type: itemTypes.find((t) => t.id === it.item_type_id)!,
        })),
      }))
  }, [persons, zones, itemTypes, company])

  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
        <div className="max-w-md rounded-xl border bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto size-10 text-amber-500" />
          <h1 className="mt-3 text-lg font-semibold">Onbekende uitnodiging</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deze link is niet (meer) geldig. Vraag de organisator om een nieuwe
            uitnodiging.
          </p>
        </div>
      </div>
    )
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const upsertCrew = (next: EnrichedCrew, opts?: { addAnother?: boolean }) => {
    const wasEditing = !!editing
    const { zones: _z, items, ...rest } = next
    accreditationActions.upsertPerson({
      ...rest,
      items: items.map(({ type: _t, ...it }) => it),
    })
    showToast(
      wasEditing
        ? `${next.first_name} ${next.last_name} bijgewerkt`
        : `${next.first_name} ${next.last_name} ingediend bij productie`
    )
    if (!wasEditing) setLastCreated(next)
    setEditing(null)
    setCreating(opts?.addAnother ?? false)
  }

  const removeCrew = (id: string) => {
    const p = crew.find((x) => x.id === id)
    if (!p) return
    if (p.status !== "draft") return // safety guard
    if (!confirm(`${p.first_name} ${p.last_name} verwijderen?`)) return
    accreditationActions.deletePerson(id)
    showToast(`${p.first_name} ${p.last_name} verwijderd`)
  }

  const draftCount = crew.filter((p) => p.status === "draft").length
  const lockedCount = crew.length - draftCount
  const limit = company.max_persons

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {project.name}
            </p>
            <h1 className="text-base font-semibold tracking-tight">
              Accreditatie aanvragen
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{company.name}</span>
            <GroupTypeBadge type={company.type} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">
            Welkom{company.contact_name ? `, ${company.contact_name}` : ""}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vul hieronder de crewleden van <strong>{company.name}</strong> in
            voor {project.name}. Klik <strong>Crew toevoegen</strong> om een
            nieuw lid toe te voegen, of klik op een bestaand lid om de gegevens
            aan te passen. Goedgekeurde crew is door de productie vergrendeld
            en niet meer aanpasbaar — neem contact op met de organisator als
            er iets gewijzigd moet worden.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-md border bg-zinc-50/50 p-3 text-xs">
            <Stat
              label="Totaal"
              value={`${crew.length}${limit ? ` / ${limit}` : ""}`}
            />
            <Stat label="In behandeling" value={draftCount} tone="amber" />
            <Stat label="Goedgekeurd" value={lockedCount} tone="emerald" />
          </div>

          <PortalLimitsPanel
            company={company}
            crew={crew}
            itemTypes={itemTypes}
          />
        </div>

        {/* Crew list */}
        <section className="mt-4 rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="font-semibold tracking-tight">Crew</h3>
              <p className="text-xs text-muted-foreground">
                {crew.length === 0
                  ? "Nog geen crewleden ingevuld."
                  : `${crew.length} crewleden`}
              </p>
            </div>
            <Button
              onClick={() => setCreating(true)}
              disabled={!!limit && crew.length >= limit}
            >
              <Plus className="size-4" />
              Crew toevoegen
            </Button>
          </div>

          {crew.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Begin door je eerste crewlid toe te voegen.
              </p>
              <Button className="mt-4" onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Eerste crewlid toevoegen
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {crew.map((p) => {
                const isLocked = p.status !== "draft"
                const totalMeals = Object.values(p.meal_selections).reduce(
                  (acc, ms) => acc + (ms as string[]).length,
                  0
                )
                const itemNames = [
                  ...new Set(p.items.map((it) => it.type.name)),
                ]
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-zinc-50"
                  >
                    <button
                      onClick={() => setEditing(p)}
                      className="flex flex-1 items-start gap-3 text-left"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                        {p.first_name[0]}
                        {p.last_name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium">
                            {p.first_name} {p.last_name}
                          </span>
                          {p.role && (
                            <span className="text-xs text-muted-foreground">
                              · {p.role}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {p.valid_days.length} dagen
                            {p.approved_days.length > 0 &&
                              ` · ${p.approved_days.length} goedgekeurd`}
                          </span>
                          {totalMeals > 0 && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                              🍽 {totalMeals}
                            </span>
                          )}
                          {itemNames.length > 0 && (
                            <span className="truncate">
                              {itemNames.slice(0, 3).join(", ")}
                              {itemNames.length > 3 && ` +${itemNames.length - 3}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={p.status} />
                      {isLocked ? (
                        <span
                          className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-500"
                          title="Goedgekeurd door productie — niet meer aanpasbaar"
                        >
                          <Lock className="size-3" />
                          Vergrendeld
                        </span>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditing(p)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeCrew(p.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {lockedCount > 0 && (
            <div className="border-t bg-emerald-50/40 px-4 py-3 text-xs">
              <p className="inline-flex items-start gap-2 text-emerald-900">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <strong>{lockedCount}</strong>{" "}
                  {lockedCount === 1 ? "crewlid is" : "crewleden zijn"} al
                  goedgekeurd door de productie en daardoor vergrendeld. Klik
                  erop om de gegevens te bekijken — wijzigingen lopen via de
                  organisator.
                </span>
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-md border bg-white px-4 py-2 text-sm shadow-lg ring-1 ring-emerald-200">
            {toast}
          </div>
        </div>
      )}

      {/* Form dialog */}
      <CrewFormDialog
        open={creating || editing !== null}
        person={editing}
        company={company}
        allDays={allDays}
        zones={zones}
        itemTypes={itemTypes}
        project={project}
        previousTemplate={!editing ? lastCreated : null}
        mode="portal"
        onClose={() => {
          setEditing(null)
          setCreating(false)
        }}
        onSave={upsertCrew}
        onDelete={removeCrew}
      />
    </div>
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
      <div className={cn("text-base font-semibold tabular-nums", toneCls)}>
        {value}
      </div>
    </div>
  )
}

function PortalLimitsPanel({
  company,
  crew,
  itemTypes,
}: {
  company: Group
  crew: EnrichedCrew[]
  itemTypes: ItemType[]
}) {
  const usedByItem = new Map<string, number>()
  const usedByVariant = new Map<string, Map<string, number>>()
  crew.forEach((p) =>
    p.items.forEach((it) => {
      usedByItem.set(
        it.item_type_id,
        (usedByItem.get(it.item_type_id) ?? 0) + it.quantity
      )
      if (it.selected_variant) {
        const m =
          usedByVariant.get(it.item_type_id) ?? new Map<string, number>()
        m.set(
          it.selected_variant,
          (m.get(it.selected_variant) ?? 0) + it.quantity
        )
        usedByVariant.set(it.item_type_id, m)
      }
    })
  )

  const rows: Array<{
    id: string
    name: string
    label: string
    color?: string
    limit: number
    used: number
  }> = []
  Object.entries(company.item_limits).forEach(([id, value]) => {
    const type = itemTypes.find((it) => it.id === id)
    if (!type) return
    if (typeof value === "number") {
      rows.push({
        id,
        name: type.name,
        label: type.name,
        color: type.color,
        limit: value,
        used: usedByItem.get(id) ?? 0,
      })
    } else {
      Object.entries(value).forEach(([variant, max]) => {
        if (max <= 0) return
        rows.push({
          id: `${id}-${variant}`,
          name: type.name,
          label: `${type.name} · ${variant}`,
          color: type.color,
          limit: max,
          used: usedByVariant.get(id)?.get(variant) ?? 0,
        })
      })
    }
  })

  if (rows.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Wat mag dit bedrijf aanvragen?
      </h3>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {rows.map((r) => {
          const pct = r.limit > 0 ? r.used / r.limit : 0
          const tone =
            pct >= 1
              ? "border-red-300 bg-red-50"
              : pct >= 0.8
              ? "border-amber-300 bg-amber-50"
              : "border-zinc-200 bg-white"
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-md border px-2 py-1 ${tone}`}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                {r.color && (
                  <span
                    className="size-2 rounded-sm ring-1 ring-zinc-300"
                    style={{ backgroundColor: r.color }}
                  />
                )}
                <span className="truncate text-[11px]">{r.label}</span>
              </div>
              <span className="text-xs font-semibold tabular-nums">
                {r.used}
                <span className="font-normal text-muted-foreground">
                  /{r.limit}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
