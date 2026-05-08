"use client"

import { useEffect, useMemo, useState } from "react"
import { accreditationActions } from "@/lib/store/accreditation-store"
import {
  Plus,
  Mail,
  Copy,
  Send,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  X,
  RotateCcw,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GroupTypeBadge } from "@/components/accreditation/RoleBadge"
import { StatusBadge } from "@/components/accreditation/StatusBadge"
import { ZoneBadge } from "@/components/accreditation/ZoneBadge"
import { dayLabel } from "@/lib/mock/data"
import type {
  Group,
  Person,
  PersonItem,
  Zone,
  ItemType,
  Project,
} from "@/types/accreditation"
import { CrewFormDialog } from "./CrewFormDialog"
import { CompanyLimitsDialog } from "./CompanyLimitsDialog"
import { CompanyCrewGrid } from "./CompanyCrewGrid"
import { CompanyFormDialog } from "../../_components/CompanyFormDialog"

export type EnrichedCrew = Omit<Person, "items"> & {
  zones: Zone[]
  items: Array<PersonItem & { type: ItemType }>
}

export function CompanyCrewView({
  company,
  crew,
  allDays,
  zones,
  itemTypes,
  project,
}: {
  company: Group
  crew: EnrichedCrew[]
  allDays: string[]
  zones: Zone[]
  itemTypes: ItemType[]
  project: Project
}) {
  const [editing, setEditing] = useState<EnrichedCrew | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [lastCreated, setLastCreated] = useState<EnrichedCrew | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const inviteUrl = `${origin}/accreditation/${company.invite_token}`

  const [showLimits, setShowLimits] = useState(false)
  const [showEditCompany, setShowEditCompany] = useState(false)
  const [view, setView] = useState<"list" | "grid">("list")

  const counts = useMemo(() => {
    const draft = crew.filter((p) => p.status === "draft").length
    const approved = crew.filter((p) =>
      ["approved", "checked_in", "checked_out"].includes(p.status)
    ).length
    return { draft, approved }
  }, [crew])

  const itemUsage = useMemo(() => {
    const byItem = new Map<string, number>()
    const byVariant = new Map<string, Map<string, number>>()
    crew.forEach((p) =>
      p.items.forEach((it) => {
        byItem.set(
          it.item_type_id,
          (byItem.get(it.item_type_id) ?? 0) + it.quantity
        )
        if (it.selected_variant) {
          const m = byVariant.get(it.item_type_id) ?? new Map<string, number>()
          m.set(
            it.selected_variant,
            (m.get(it.selected_variant) ?? 0) + it.quantity
          )
          byVariant.set(it.item_type_id, m)
        }
      })
    )
    return { byItem, byVariant }
  }, [crew])

  type LimitEntry = {
    id: string
    type: ItemType
    label: string
    limit: number
    used: number
    variant?: string
  }

  const limitedItems = useMemo<LimitEntry[]>(() => {
    const entries: LimitEntry[] = []
    Object.entries(company.item_limits).forEach(([id, value]) => {
      const type = itemTypes.find((it) => it.id === id)
      if (!type) return
      if (typeof value === "number") {
        entries.push({
          id,
          type,
          label: type.name,
          limit: value,
          used: itemUsage.byItem.get(id) ?? 0,
        })
      } else {
        Object.entries(value).forEach(([variant, max]) => {
          if (max <= 0) return
          entries.push({
            id,
            type,
            variant,
            label: `${type.name} · ${variant}`,
            limit: max,
            used: itemUsage.byVariant.get(id)?.get(variant) ?? 0,
          })
        })
      }
    })
    return entries
  }, [company.item_limits, itemTypes, itemUsage])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const upsertCrew = (next: EnrichedCrew, opts?: { addAnother?: boolean }) => {
    const wasEditing = !!editing
    const wasDraft = editing?.status === "draft"
    // Strip enriched fields before persisting
    const { zones: _z, items, ...rest } = next
    accreditationActions.upsertPerson({
      ...rest,
      items: items.map(({ type: _t, ...it }) => it),
    })
    const fullName = `${next.first_name} ${next.last_name}`
    let msg: string
    if (!wasEditing) {
      msg =
        next.status === "approved"
          ? `${fullName} toegevoegd & goedgekeurd voor ${next.valid_days.length} dagen`
          : `${fullName} toegevoegd`
    } else if (wasDraft && next.status === "approved") {
      msg = `${fullName} bijgewerkt & goedgekeurd voor ${next.valid_days.length} dagen`
    } else {
      msg = `${fullName} bijgewerkt`
    }
    showToast(msg)
    if (!editing) setLastCreated(next)
    setEditing(null)
    if (opts?.addAnother) {
      setCreating(true)
    } else {
      setCreating(false)
    }
  }

  const removeCrew = (id: string) => {
    const p = crew.find((x) => x.id === id)
    if (!p) return
    if (!confirm(`${p.first_name} ${p.last_name} verwijderen?`)) return
    accreditationActions.deletePerson(id)
    showToast(`${p.first_name} ${p.last_name} verwijderd`)
  }

  return (
    <>
      {/* Header: company info */}
      <header className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {company.name}
              </h1>
              <GroupTypeBadge type={company.type} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditCompany(true)}
                title="Bewerk bedrijf (zones, contact, etc.)"
              >
                <Pencil className="size-3.5" />
                <span className="text-xs">Bewerk</span>
              </Button>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {company.contact_name && <span>{company.contact_name}</span>}
              {company.contact_email && (
                <a
                  href={`mailto:${company.contact_email}`}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Mail className="size-3.5" />
                  {company.contact_email}
                </a>
              )}
              <span>
                {crew.length}
                {company.max_persons ? ` / ${company.max_persons}` : ""} crew
              </span>
              <span className="text-amber-700">{counts.draft} pending</span>
              <span className="text-emerald-700">
                {counts.approved} goedgekeurd
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 border-t bg-zinc-50/50 p-4 sm:grid-cols-2">
          <div className="rounded-md border bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Publieke uitnodigingslink
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => {
                  navigator.clipboard?.writeText(inviteUrl)
                  setTokenCopied(true)
                  showToast("Link gekopieerd")
                  setTimeout(() => setTokenCopied(false), 2000)
                }}
              >
                {tokenCopied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                Kopieer
              </Button>
            </div>
            <code className="mt-1 line-clamp-1 break-all font-mono text-xs text-zinc-600">
              {inviteUrl}
            </code>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Stuur deze naar het bedrijf zodat ze zelf hun crew kunnen invullen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                showToast(
                  company.contact_email
                    ? `Uitnodiging verstuurd naar ${company.contact_email}`
                    : `Mail kan niet worden verzonden — geen e-mail bekend`
                )
              }}
              disabled={!company.contact_email}
            >
              <Send className="size-4" />
              E-mail uitnodiging
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href={inviteUrl} target="_blank">
                <ExternalLink className="size-4" />
                Open portaal
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  confirm(
                    "Token regenereren? De oude link werkt daarna niet meer."
                  )
                ) {
                  accreditationActions.regenerateInviteToken(company.id)
                  showToast("Nieuwe uitnodigingslink gegenereerd")
                }
              }}
              title="Regenereer uitnodigingslink"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Limits summary */}
      {limitedItems.length > 0 ? (
        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Toegestaan voor dit bedrijf
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Maxima per item — bovenop het maximum aantal crewleden{" "}
                {company.max_persons ? `(${company.max_persons})` : "(onbeperkt)"}.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowLimits(true)}>
              <SlidersHorizontal className="size-3.5" />
              Limieten beheren
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
            {limitedItems.map(({ id, type, label, limit, used, variant }) => {
              const pct = limit > 0 ? used / limit : 0
              const tone =
                pct >= 1
                  ? "border-red-300 bg-red-50"
                  : pct >= 0.8
                  ? "border-amber-300 bg-amber-50"
                  : "border-zinc-200 bg-white"
              return (
                <div
                  key={`${id}-${variant ?? ""}`}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-3 py-2",
                    tone
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {type.color && (
                        <span
                          className="size-2.5 rounded-sm ring-1 ring-zinc-300"
                          style={{ backgroundColor: type.color }}
                        />
                      )}
                      <span className="truncate text-xs font-medium">
                        {label}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      pct >= 1
                        ? "text-red-700"
                        : pct >= 0.8
                        ? "text-amber-700"
                        : "text-foreground"
                    )}
                  >
                    {used}
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      / {limit}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed bg-card/60 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Dit bedrijf heeft nog geen limieten ingesteld — geen items
            beschikbaar voor aanvraag.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setShowLimits(true)}
          >
            <SlidersHorizontal className="size-3.5" />
            Limieten instellen
          </Button>
        </section>
      )}

      {/* Crew section */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold tracking-tight">Crew</h2>
            <p className="text-xs text-muted-foreground">
              Voeg crewleden toe en kies per persoon de dagen, items en maaltijden.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border bg-white p-0.5">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "rounded p-1 transition-colors",
                  view === "list"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                )}
                aria-label="Lijst"
                title="Lijst"
              >
                <List className="size-3.5" />
              </button>
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "rounded p-1 transition-colors",
                  view === "grid"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                )}
                aria-label="Tabel"
                title="Tabel-overzicht"
              >
                <LayoutGrid className="size-3.5" />
              </button>
            </div>
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Crew toevoegen
            </Button>
          </div>
        </div>

        {crew.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nog geen crewleden voor {company.name}.
            </p>
            <Button className="mt-4" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Eerste crewlid toevoegen
            </Button>
          </div>
        ) : view === "grid" ? (
          <CompanyCrewGrid
            crew={crew}
            allDays={allDays}
            itemTypes={itemTypes}
            company={company}
            onSelect={setEditing}
          />
        ) : (
          <ul className="divide-y">
            {crew.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-zinc-50"
              >
                <button
                  onClick={() => setEditing(p)}
                  className="flex flex-1 items-center gap-3 text-left"
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
                      {(() => {
                        const totalMeals = Object.values(p.meal_selections).reduce(
                          (acc, ms) => acc + (ms as string[]).length,
                          0
                        )
                        return totalMeals > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                            🍽 {totalMeals} maaltijden
                          </span>
                        ) : null
                      })()}
                      {(() => {
                        const itemNames = [
                          ...new Set(
                            p.items.map(
                              (it) =>
                                `${it.type.name}${
                                  it.selected_variant
                                    ? ` (${it.selected_variant})`
                                    : ""
                                }`
                            )
                          ),
                        ]
                        return itemNames.length > 0 ? (
                          <span className="truncate">
                            {itemNames.slice(0, 3).join(", ")}
                            {itemNames.length > 3 && ` +${itemNames.length - 3}`}
                          </span>
                        ) : null
                      })()}
                    </div>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={p.status} />
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50">
          <div className="rounded-md border bg-card px-4 py-2 text-sm shadow-lg ring-1 ring-emerald-200">
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
        onClose={() => {
          setEditing(null)
          setCreating(false)
        }}
        onSave={upsertCrew}
        onDelete={removeCrew}
      />

      <CompanyLimitsDialog
        open={showLimits}
        company={company}
        onClose={() => setShowLimits(false)}
      />

      <CompanyFormDialog
        open={showEditCompany}
        company={company}
        onClose={() => setShowEditCompany(false)}
      />
    </>
  )
}
