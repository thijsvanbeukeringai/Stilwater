"use client"

import { useEffect, useMemo, useState } from "react"
import {
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Copy as CopyIcon,
  Plus,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { usePersons } from "@/lib/store/accreditation-store"
import {
  getAllowedVariants,
  getVariantLimit,
  isItemAllowed,
  isPerVariant,
} from "@/lib/limits"
import type {
  Group,
  Project,
  Zone,
  ItemType,
  PersonItem,
  MealType,
} from "@/types/accreditation"
import type { EnrichedCrew } from "./CompanyCrewView"

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Ontbijt",
  lunch: "Lunch",
  dinner: "Diner",
  nightsnack: "Nachtsnack",
}
const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "nightsnack"]

type FormState = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  notes: string
  valid_days: string[]
  zone_ids: string[]
  meal_selections: Record<string, MealType[]>
  perPersonItems: Map<
    string,
    { enabled: boolean; quantity: number; selected_variant?: string }
  >
  perDayItems: Map<
    string,
    Record<string, { enabled: boolean; selected_variant?: string }>
  >
}

type Errors = Partial<Record<"first_name" | "last_name" | "email", string>>

const newId = () => Math.random().toString(36).slice(2)

const dayLong = (d: string) =>
  new Date(d).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })

export function CrewFormDialog({
  open,
  person,
  company,
  allDays,
  zones,
  itemTypes,
  project,
  onClose,
  onSave,
  onDelete,
  previousTemplate,
  mode = "admin",
}: {
  open: boolean
  person: EnrichedCrew | null
  company: Group
  allDays: string[]
  zones: Zone[]
  itemTypes: ItemType[]
  project: Project
  onClose: () => void
  onSave: (next: EnrichedCrew, opts?: { addAnother?: boolean }) => void
  onDelete?: (id: string) => void
  previousTemplate?: EnrichedCrew | null
  /** "admin" = full powers incl. approve-on-save. "portal" = company self-service:
   *  saves stay draft, approved crew is locked read-only. */
  mode?: "admin" | "portal"
}) {
  const [state, setState] = useState<FormState | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [addAnother, setAddAnother] = useState(false)

  useEffect(() => {
    if (!open) return
    const initial = personToState(person, newId())

    // For brand-new crew: inherit company defaults so the user doesn't have to
    // re-pick zones (those live on the company in v2) and so the wristband is
    // auto-assigned when the company uses pool mode.
    if (!person) {
      // Zones come from the company. Portal mode never shows the zone picker
      // anyway, so this is the only path that fills them in.
      if (initial.zone_ids.length === 0 && company.zone_ids?.length) {
        initial.zone_ids = [...company.zone_ids]
      }
      // Auto-pick first allowed wristband for preprinted strategy.
      // Zebra-print doesn't use a pool — bandje wordt per persoon geprint.
      if (project.wristband_strategy !== "zebra_print") {
        const allowedWb = itemTypes.find(
          (it) =>
            it.category === "wristband" && isItemAllowed(company.item_limits, it.id)
        )
        if (allowedWb) {
          initial.perPersonItems.set(allowedWb.id, {
            enabled: true,
            quantity: 1,
          })
        }
      }
    }

    setState(initial)
    setErrors({})
    // Auto-expand all selected days
    setExpanded(new Set(initial.valid_days))
  }, [open, person, company, itemTypes])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave({ addAnother: false })
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        handleSave({ addAnother: true })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, state, addAnother])

  const sortedSelectedDays = useMemo(
    () => (state ? [...state.valid_days].sort() : []),
    [state]
  )

  // Live usage by other crew (excluding the current draft) per item AND per
  // (item, variant) pair — must be declared *before* the early return below so
  // hook order is stable across renders (Rules of Hooks).
  const allPersons = usePersons()
  const otherUsage = useMemo(() => {
    const byItem = new Map<string, number>()
    const byVariant = new Map<string, number>() // key: `${itemId}::${variant}`
    if (!state) return { byItem, byVariant }
    allPersons
      .filter((p) => p.group_id === company.id && p.id !== state.id)
      .forEach((p) =>
        p.items.forEach((it) => {
          byItem.set(
            it.item_type_id,
            (byItem.get(it.item_type_id) ?? 0) + it.quantity
          )
          if (it.selected_variant) {
            const k = `${it.item_type_id}::${it.selected_variant}`
            byVariant.set(k, (byVariant.get(k) ?? 0) + it.quantity)
          }
        })
      )
    return { byItem, byVariant }
  }, [allPersons, company.id, state])

  if (!open || !state) return null

  // Reference sortedSelectedDays so it isn't tree-shaken (kept for future use)
  void sortedSelectedDays

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState((s) => (s ? { ...s, [k]: v } : s))

  const toggleDay = (d: string) => {
    setState((s) => {
      if (!s) return s
      const isOn = s.valid_days.includes(d)
      const next = isOn
        ? s.valid_days.filter((x) => x !== d)
        : [...s.valid_days, d].sort()
      return { ...s, valid_days: next }
    })
    setExpanded((e) => {
      const next = new Set(e)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  const setAllDays = (mode: "all" | "show" | "build" | "none") => {
    let target: string[] = []
    if (mode === "all") target = [...allDays]
    if (mode === "show") target = [...project.show_days]
    if (mode === "build") target = [...project.build_days]
    setField("valid_days", target.sort())
    setExpanded(new Set(target))
  }

  const toggleZone = (zid: string) =>
    setState((s) =>
      s
        ? {
            ...s,
            zone_ids: s.zone_ids.includes(zid)
              ? s.zone_ids.filter((x) => x !== zid)
              : [...s.zone_ids, zid],
          }
        : s
    )

  const toggleMeal = (day: string, meal: MealType) =>
    setState((s) => {
      if (!s) return s
      const cur = s.meal_selections[day] ?? []
      const next = cur.includes(meal)
        ? cur.filter((m) => m !== meal)
        : [...cur, meal]
      return { ...s, meal_selections: { ...s.meal_selections, [day]: next } }
    })

  const bulkMeal = (meal: MealType) => {
    setState((s) => {
      if (!s) return s
      const allOn = s.valid_days.every((d) => {
        const allowed = (project.day_meals[d] ?? []) as MealType[]
        if (!allowed.includes(meal)) return true
        return (s.meal_selections[d] ?? []).includes(meal)
      })
      const next: Record<string, MealType[]> = { ...s.meal_selections }
      s.valid_days.forEach((d) => {
        const allowed = (project.day_meals[d] ?? []) as MealType[]
        if (!allowed.includes(meal)) return
        const cur = next[d] ?? []
        next[d] = allOn
          ? cur.filter((m) => m !== meal)
          : [...new Set([...cur, meal])]
      })
      return { ...s, meal_selections: next }
    })
  }

  const setPerPerson = (
    typeId: string,
    update: Partial<{
      enabled: boolean
      quantity: number
      selected_variant?: string
    }>
  ) =>
    setState((s) => {
      if (!s) return s
      const cur = s.perPersonItems.get(typeId) ?? { enabled: false, quantity: 1 }
      const next = new Map(s.perPersonItems)
      next.set(typeId, { ...cur, ...update })
      return { ...s, perPersonItems: next }
    })

  /**
   * Single-select wristband: enables the chosen wristband at qty=1 and disables
   * all other wristbands. Pass null to clear.
   */
  const setWristband = (typeId: string | null) =>
    setState((s) => {
      if (!s) return s
      const next = new Map(s.perPersonItems)
      // Disable all current wristband items
      itemTypes
        .filter((it) => it.category === "wristband")
        .forEach((wb) => {
          const cur = next.get(wb.id)
          if (cur?.enabled) next.set(wb.id, { ...cur, enabled: false })
        })
      if (typeId) {
        next.set(typeId, { enabled: true, quantity: 1 })
      }
      return { ...s, perPersonItems: next }
    })

  const togglePerDayItem = (typeId: string, day: string, variant?: string) =>
    setState((s) => {
      if (!s) return s
      const next = new Map(s.perDayItems)
      const cur = { ...(next.get(typeId) ?? {}) }
      const dayCfg = cur[day]
      if (!dayCfg || !dayCfg.enabled) {
        cur[day] = { enabled: true, selected_variant: variant }
      } else if (dayCfg.selected_variant === variant) {
        cur[day] = { enabled: false }
      } else {
        cur[day] = { enabled: true, selected_variant: variant }
      }
      next.set(typeId, cur)
      return { ...s, perDayItems: next }
    })

  const applyPerDayItemToAll = (typeId: string, variant?: string) =>
    setState((s) => {
      if (!s) return s
      const next = new Map(s.perDayItems)
      const cur = { ...(next.get(typeId) ?? {}) }
      s.valid_days.forEach((d) => {
        cur[d] = { enabled: true, selected_variant: variant }
      })
      next.set(typeId, cur)
      return { ...s, perDayItems: next }
    })

  const copyFromPrevious = () => {
    if (!previousTemplate || !state) return
    const tpl = personToState(previousTemplate, state.id)
    setState({
      ...tpl,
      id: state.id,
      first_name: state.first_name,
      last_name: state.last_name,
      email: state.email,
      role: state.role || tpl.role,
    })
    setExpanded(new Set(tpl.valid_days))
  }

  const validate = (): Errors => {
    const next: Errors = {}
    if (!state.first_name.trim()) next.first_name = "Voornaam is verplicht"
    if (!state.last_name.trim()) next.last_name = "Achternaam is verplicht"
    if (state.email && !/^\S+@\S+\.\S+$/.test(state.email))
      next.email = "Ongeldig e-mailadres"
    return next
  }

  const handleSave = (opts: { addAnother: boolean }) => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const itemsArr: PersonItem[] = []
    state.perPersonItems.forEach((cfg, typeId) => {
      if (!cfg.enabled || cfg.quantity < 1) return
      itemsArr.push({
        id: newId(),
        person_id: state.id,
        item_type_id: typeId,
        quantity: cfg.quantity,
        selected_variant: cfg.selected_variant,
        issued: false,
      })
    })
    state.perDayItems.forEach((dayMap, typeId) => {
      Object.entries(dayMap).forEach(([day, cfg]) => {
        if (!cfg.enabled) return
        if (!state.valid_days.includes(day)) return
        itemsArr.push({
          id: newId(),
          person_id: state.id,
          item_type_id: typeId,
          quantity: 1,
          selected_variant: cfg.selected_variant,
          day,
          issued: false,
        })
      })
    })

    // Auto-approve in admin mode only: if button label says "Opslaan & goedkeuren"
    // we actually approve. In portal mode the company never approves their own
    // crew — admin must do that.
    const incomingStatus = person?.status ?? "draft"
    const approveOnSave = mode === "admin" && incomingStatus === "draft"
    const nextStatus = approveOnSave ? "approved" : incomingStatus
    const nextApprovedDays = approveOnSave
      ? state.valid_days
      : (person?.approved_days ?? state.valid_days).filter((d) =>
          state.valid_days.includes(d)
        )

    const next: EnrichedCrew = {
      id: state.id,
      project_id: company.project_id,
      group_id: company.id,
      first_name: state.first_name.trim(),
      last_name: state.last_name.trim(),
      email: state.email || undefined,
      role: state.role || undefined,
      status: nextStatus,
      qr_token:
        person?.qr_token ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replace(/-/g, "").slice(0, 32)
          : `${newId()}${newId()}`.slice(0, 32)),
      checked_in_at: person?.checked_in_at,
      checked_out_at: person?.checked_out_at,
      valid_days: state.valid_days,
      approved_days: nextApprovedDays,
      meal_selections: Object.fromEntries(
        Object.entries(state.meal_selections).filter(([, v]) => v.length > 0)
      ),
      notes: state.notes || undefined,
      zone_ids: state.zone_ids,
      zones: zones.filter((z) => state.zone_ids.includes(z.id)),
      items: itemsArr.map((it) => ({
        ...it,
        type: itemTypes.find((t) => t.id === it.item_type_id)!,
      })),
    }
    onSave(next, opts)
  }

  // Only allow items the company has a limit for. Items not in
  // company.item_limits — or with all variants disabled — are not requestable.
  const allowedItems = itemTypes.filter((it) =>
    isItemAllowed(company.item_limits, it.id)
  )
  // Wristbands get their own section (single-select, qty 1) — split them out
  // here so the regular per-person items list shows everything else. Pool of
  // physical wristbands only applies when project uses preprinted strategy;
  // zebra-print prints a per-person band so no pool is needed.
  const wristbandStrategy: "preprinted" | "zebra_print" =
    project.wristband_strategy ?? "preprinted"
  const allowedWristbands =
    wristbandStrategy === "preprinted"
      ? allowedItems.filter((it) => it.category === "wristband")
      : []
  const perPersonItems = allowedItems.filter(
    (it) => it.scope === "per_person" && it.category !== "wristband"
  )
  const perDayItems = allowedItems.filter((it) => it.scope === "per_day")

  const currentWristbandId = (() => {
    for (const wb of itemTypes.filter((it) => it.category === "wristband")) {
      if (state.perPersonItems.get(wb.id)?.enabled) return wb.id
    }
    return null
  })()

  /** How many of `typeId` (with optional variant) the current draft can still take. */
  const remainingFor = (typeId: string, variant?: string) => {
    const perVariant = isPerVariant(company.item_limits, typeId)
    if (perVariant) {
      const lim = getVariantLimit(company.item_limits, typeId, variant) ?? 0
      const used = otherUsage.byVariant.get(`${typeId}::${variant ?? ""}`) ?? 0
      return Math.max(0, lim - used)
    }
    const total = company.item_limits[typeId]
    const lim = typeof total === "number" ? total : 0
    if (!lim) return Infinity
    return Math.max(0, lim - (otherUsage.byItem.get(typeId) ?? 0))
  }

  /** Variants the company is allowed to choose for this item. */
  const allowedVariantsFor = (it: ItemType) =>
    getAllowedVariants(company.item_limits, it.id, it.variants)
  const isApproved =
    person?.status === "approved" || person?.status === "checked_in"
  // Portal mode locks approved (or further) crew so the company can't change
  // anything once admin has signed off.
  const readOnly = mode === "portal" && !!person && person.status !== "draft"

  const summary = (d: string): string => {
    const meals = state.meal_selections[d] ?? []
    const dayItems: string[] = []
    state.perDayItems.forEach((dayMap, typeId) => {
      const cfg = dayMap[d]
      if (cfg?.enabled) {
        const t = itemTypes.find((x) => x.id === typeId)
        if (t) dayItems.push(cfg.selected_variant ?? t.name)
      }
    })
    const parts: string[] = []
    if (meals.length > 0) parts.push(`${meals.length} maaltijd${meals.length > 1 ? "en" : ""}`)
    if (dayItems.length > 0) parts.push(dayItems.slice(0, 3).join(", "))
    return parts.join(" · ")
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-5xl flex-col bg-white shadow-2xl">
        {/* Sticky header */}
        <header className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight">
              {state.first_name || state.last_name
                ? `${state.first_name} ${state.last_name}`.trim()
                : person
                ? "Crewlid bewerken"
                : "Nieuw crewlid"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <GroupTypeChip type={company.type} />
              {person?.status && <StatusChip status={person.status} />}
              {state.role && (
                <span className="text-muted-foreground">{state.role}</span>
              )}
              <span className="text-muted-foreground">· {company.name}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {previousTemplate && !person && (
              <Button size="sm" variant="outline" onClick={copyFromPrevious}>
                <CopyIcon className="size-3.5" />
                Kopieer vorige
              </Button>
            )}
            {person && (
              <Button asChild size="sm" variant="outline">
                <a href={`/accreditation/ticket/${person.qr_token}`} target="_blank">
                  Ticket
                  <ExternalLink className="size-3" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </header>

        {/* Body — note: inert (not pointer-events-none) so scroll still works */}
        <div
          className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
          aria-disabled={readOnly}
          {...(readOnly ? { inert: "" as unknown as boolean } : {})}
        >
          {/* LEFT */}
          <div className="overflow-y-auto border-r px-6 py-5">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Voornaam" required error={errors.first_name}>
                  <Input
                    value={state.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                    autoFocus={!person}
                    aria-invalid={!!errors.first_name}
                  />
                </Field>
                <Field label="Achternaam" required error={errors.last_name}>
                  <Input
                    value={state.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                    aria-invalid={!!errors.last_name}
                  />
                </Field>
                <Field label="E-mail" className="col-span-2" error={errors.email}>
                  <Input
                    type="email"
                    value={state.email}
                    onChange={(e) => setField("email", e.target.value)}
                    aria-invalid={!!errors.email}
                  />
                </Field>
                <Field label="Rol">
                  <Input
                    value={state.role}
                    onChange={(e) => setField("role", e.target.value)}
                    placeholder="Stage Manager"
                  />
                </Field>
                <Field label="Bedrijf">
                  <Input value={company.name} disabled />
                </Field>
              </div>

              {/* Polsbandje sectie — single-select, qty 1 */}
              {wristbandStrategy === "preprinted" ? (
                <div>
                  <SectionLabel className="mb-1">Polsbandje</SectionLabel>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Eén polsbandje per persoon. Klik om te kiezen.
                  </p>
                  {allowedWristbands.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Geen polsbandjes beschikbaar voor dit bedrijf.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allowedWristbands.map((wb) => {
                        const isOn = currentWristbandId === wb.id
                        const limit =
                          (company.item_limits[wb.id] as number) ?? 0
                        const used = otherUsage.byItem.get(wb.id) ?? 0
                        const overLimit = isOn && used + 1 > limit && limit > 0
                        return (
                          <button
                            key={wb.id}
                            type="button"
                            onClick={() =>
                              isOn ? setWristband(null) : setWristband(wb.id)
                            }
                            className={cn(
                              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ring-1 transition-all",
                              isOn
                                ? "bg-zinc-900 text-white ring-zinc-900"
                                : "bg-white text-zinc-700 ring-zinc-200 hover:ring-zinc-400",
                              overLimit && "ring-red-400"
                            )}
                          >
                            <span
                              className="size-3 rounded-sm ring-1 ring-black/10"
                              style={{ backgroundColor: wb.color ?? "#888" }}
                            />
                            {wb.name}
                            {limit > 0 && (
                              <span
                                className={cn(
                                  "rounded px-1 py-0.5 text-[10px] tabular-nums",
                                  isOn
                                    ? "bg-white/20 text-white/90"
                                    : "bg-zinc-100 text-muted-foreground"
                                )}
                              >
                                {used + (isOn ? 1 : 0)}/{limit}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md border bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  <strong>Zebra-geprint polsbandje.</strong> Bij check-in wordt
                  een persoonlijk bandje geprint met de naam en de zone-nummers
                  waar deze persoon mag komen.
                </div>
              )}

              {/* Toegangszones — alleen voor admin. Portal erven van bedrijf. */}
              {mode === "admin" && (
                <div>
                  <SectionLabel className="mb-1">Toegangszones</SectionLabel>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Standaard overgenomen van het bedrijf. Pas aan als deze
                    persoon afwijkende toegang nodig heeft.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {zones.map((z, i) => {
                      const selected = state.zone_ids.includes(z.id)
                      return (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => toggleZone(z.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 transition-all",
                            selected
                              ? "bg-zinc-900 text-white ring-zinc-900"
                              : "bg-white text-zinc-700 ring-zinc-200 hover:ring-zinc-400"
                          )}
                        >
                          <span
                            className="size-2 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: z.color }}
                          />
                          {i + 1} - {z.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {mode === "portal" && state.zone_ids.length > 0 && (
                <div className="rounded-md border bg-zinc-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Toegangszones (door productie ingesteld)
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {state.zone_ids.map((zid) => {
                      const z = zones.find((x) => x.id === zid)
                      if (!z) return null
                      return (
                        <span
                          key={z.id}
                          className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-0.5 text-xs ring-1 ring-zinc-200"
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: z.color }}
                          />
                          {z.name}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <SectionLabel className="mb-1">
                  Overige items{" "}
                  <span className="font-normal opacity-60">(per persoon)</span>
                </SectionLabel>
                <p className="mb-2 text-xs text-muted-foreground">
                  Parkeerkaart en andere benodigdheden.
                </p>
                <div className="space-y-3">
                  {perPersonItems.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Geen per-persoon items beschikbaar voor dit bedrijf. Pas{" "}
                      <strong>Limieten</strong> aan op de bedrijfspagina.
                    </p>
                  )}
                  {perPersonItems.map((it) => {
                    const cfg = state.perPersonItems.get(it.id) ?? {
                      enabled: false,
                      quantity: 0,
                    }
                    const q = cfg.enabled ? cfg.quantity : 0
                    const perVariant = isPerVariant(company.item_limits, it.id)
                    const allowedVariants = allowedVariantsFor(it)

                    // Auto-select first allowed variant when enabled and none chosen
                    if (
                      perVariant &&
                      cfg.enabled &&
                      allowedVariants.length > 0 &&
                      !allowedVariants.includes(cfg.selected_variant ?? "")
                    ) {
                      // schedule a fix in next tick to avoid render-time setState
                      setTimeout(
                        () =>
                          setPerPerson(it.id, {
                            selected_variant: allowedVariants[0],
                          }),
                        0
                      )
                    }

                    const activeVariant = perVariant
                      ? cfg.selected_variant ?? allowedVariants[0]
                      : cfg.selected_variant
                    const variantLimit = perVariant
                      ? getVariantLimit(
                          company.item_limits,
                          it.id,
                          activeVariant
                        ) ?? 0
                      : 0
                    const variantOtherUsed = perVariant
                      ? otherUsage.byVariant.get(
                          `${it.id}::${activeVariant ?? ""}`
                        ) ?? 0
                      : 0

                    const totalLimit = perVariant
                      ? variantLimit
                      : (company.item_limits[it.id] as number) ?? 0
                    const totalOtherUsed = perVariant
                      ? variantOtherUsed
                      : otherUsage.byItem.get(it.id) ?? 0

                    const remaining = remainingFor(it.id, activeVariant)
                    const atMax = q >= remaining

                    return (
                      <div key={it.id}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            {it.color && (
                              <span
                                className="size-3 rounded-sm ring-1 ring-zinc-300"
                                style={{ backgroundColor: it.color }}
                              />
                            )}
                            <span className="truncate text-sm">{it.name}</span>
                            {totalLimit > 0 && (
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                                  totalOtherUsed + q >= totalLimit
                                    ? "bg-red-100 text-red-700"
                                    : totalOtherUsed + q >= totalLimit * 0.8
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-zinc-100 text-zinc-700"
                                )}
                                title={
                                  perVariant
                                    ? `Limiet voor variant "${activeVariant}"`
                                    : "Totaal voor dit bedrijf"
                                }
                              >
                                {totalOtherUsed + q}/{totalLimit}
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() =>
                                setPerPerson(it.id, {
                                  enabled: q > 1,
                                  quantity: Math.max(0, q - 1),
                                })
                              }
                              disabled={q === 0}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-7 text-center text-sm tabular-nums">
                              {q}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                const next = q + 1
                                setPerPerson(it.id, {
                                  enabled: true,
                                  quantity: next,
                                  ...(perVariant && !cfg.selected_variant
                                    ? { selected_variant: allowedVariants[0] }
                                    : {}),
                                })
                              }}
                              disabled={
                                atMax ||
                                (perVariant && allowedVariants.length === 0)
                              }
                              title={
                                atMax
                                  ? "Limiet voor dit bedrijf bereikt"
                                  : undefined
                              }
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>
                        {cfg.enabled && allowedVariants.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {allowedVariants.map((v) => {
                              const vLim = perVariant
                                ? getVariantLimit(
                                    company.item_limits,
                                    it.id,
                                    v
                                  ) ?? 0
                                : 0
                              const vUsed =
                                otherUsage.byVariant.get(`${it.id}::${v}`) ?? 0
                              const isActive = cfg.selected_variant === v
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() =>
                                    setPerPerson(it.id, {
                                      selected_variant: v,
                                    })
                                  }
                                  className={cn(
                                    "rounded px-2 py-0.5 text-[11px] font-medium ring-1 transition-colors",
                                    isActive
                                      ? "bg-zinc-900 text-white ring-zinc-900"
                                      : "bg-zinc-100 text-zinc-700 ring-zinc-200 hover:bg-zinc-200"
                                  )}
                                >
                                  {v}
                                  {perVariant && (
                                    <span
                                      className={cn(
                                        "ml-1 tabular-nums",
                                        isActive
                                          ? "text-white/70"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      {vUsed + (isActive ? q : 0)}/{vLim}
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <Field label="Opmerkingen">
                <textarea
                  value={state.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={2}
                  placeholder="Allergieën, dieet, bijzonderheden…"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Field>
            </div>
          </div>

          {/* RIGHT: days + meals + per-day items */}
          <div className="overflow-y-auto bg-zinc-50/50 px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel className="m-0">Dagen & maaltijden</SectionLabel>
              <div className="flex flex-wrap gap-2 text-xs">
                <PresetButton onClick={() => setAllDays("all")}>Alles</PresetButton>
                <PresetButton onClick={() => setAllDays("show")}>Show</PresetButton>
                <PresetButton onClick={() => setAllDays("build")}>Opbouw</PresetButton>
                <PresetButton onClick={() => setAllDays("none")}>Geen</PresetButton>
              </div>
            </div>

            {state.valid_days.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-md border bg-white px-2 py-1.5 text-xs">
                <span className="text-muted-foreground">Bulk:</span>
                {MEAL_ORDER.map((m) => {
                  const allOn = state.valid_days.every((d) => {
                    const allowed = (project.day_meals[d] ?? []) as MealType[]
                    if (!allowed.includes(m)) return true
                    return (state.meal_selections[d] ?? []).includes(m)
                  })
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => bulkMeal(m)}
                      className={cn(
                        "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                        allOn
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      )}
                    >
                      {MEAL_LABEL[m]}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="space-y-2">
              {allDays.map((d) => {
                const isSelected = state.valid_days.includes(d)
                const isExpanded = expanded.has(d)
                const isBuild = project.build_days.includes(d)
                const meals = (project.day_meals[d] ?? []) as MealType[]
                const sel = state.meal_selections[d] ?? []
                const isApprovedDay = person?.approved_days.includes(d) ?? false

                return (
                  <div
                    key={d}
                    className={cn(
                      "rounded-xl border bg-white transition-all",
                      isSelected ? "border-zinc-900" : "border-zinc-200"
                    )}
                  >
                    <header className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="flex flex-1 items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleDay(d)}
                          className="size-5"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!isSelected) toggleDay(d)
                            else
                              setExpanded((e) => {
                                const next = new Set(e)
                                next.has(d) ? next.delete(d) : next.add(d)
                                return next
                              })
                          }}
                          className="flex flex-1 items-center gap-2 text-left"
                        >
                          <span className="text-sm font-semibold capitalize">
                            {dayLong(d)}
                          </span>
                          <DayKindBadge build={isBuild} />
                          {isSelected && !isExpanded && (
                            <span className="ml-2 truncate text-xs text-muted-foreground">
                              {summary(d) || "klik om in te vullen"}
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isApprovedDay && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                            ✓ Goedgekeurd
                          </span>
                        )}
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((e) => {
                                const next = new Set(e)
                                next.has(d) ? next.delete(d) : next.add(d)
                                return next
                              })
                            }
                            className="text-zinc-400 hover:text-foreground"
                            aria-label={isExpanded ? "Inklappen" : "Uitklappen"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </header>

                    {isSelected && isExpanded && (
                      <div className="space-y-3 border-t px-3 py-3">
                        {/* Meals */}
                        {meals.length > 0 && (
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                            {MEAL_ORDER.filter((m) => meals.includes(m)).map(
                              (m) => {
                                const isOn = sel.includes(m)
                                return (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => toggleMeal(d, m)}
                                    className={cn(
                                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                                      isOn
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                    )}
                                  >
                                    {MEAL_LABEL[m]}
                                  </button>
                                )
                              }
                            )}
                          </div>
                        )}

                        {/* Per-day items */}
                        {perDayItems.map((it) => {
                          const dayCfg = state.perDayItems.get(it.id)?.[d]
                          const variants =
                            it.variants.length > 0 ? it.variants : [it.name]
                          return (
                            <div key={it.id}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-600">
                                  {it.name}
                                </span>
                                {dayCfg?.enabled && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      applyPerDayItemToAll(
                                        it.id,
                                        dayCfg.selected_variant
                                      )
                                    }
                                    className="text-[10px] font-medium text-zinc-500 hover:text-foreground"
                                  >
                                    → alle dagen
                                  </button>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {variants.map((v) => {
                                  const isVarOn =
                                    !!dayCfg?.enabled &&
                                    (it.variants.length === 0 ||
                                      dayCfg?.selected_variant === v)
                                  return (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() =>
                                        togglePerDayItem(
                                          it.id,
                                          d,
                                          it.variants.length === 0 ? undefined : v
                                        )
                                      }
                                      className={cn(
                                        "rounded-md px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
                                        isVarOn
                                          ? "bg-emerald-600 text-white ring-emerald-600"
                                          : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
                                      )}
                                    >
                                      {v}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            {readOnly && (
              <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Goedgekeurd door productie · niet meer aanpasbaar
              </span>
            )}
            {!readOnly && person && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(`${person.first_name} ${person.last_name} verwijderen?`)
                  ) {
                    onDelete(person.id)
                    onClose()
                  }
                }}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Verwijderen
              </button>
            )}
            {!person && (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={addAnother}
                  onCheckedChange={(v) => setAddAnother(!!v)}
                />
                Direct nóg een crewlid toevoegen
              </label>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">⌘</kbd>
                <kbd className="ml-0.5 rounded border bg-muted px-1 font-mono text-[10px]">S</kbd>{" "}
                opslaan
              </span>
            )}
            <Button variant="outline" onClick={onClose}>
              {readOnly ? "Sluiten" : "Annuleren"}
            </Button>
            {!readOnly && (
              <Button
                onClick={() => handleSave({ addAnother })}
                className="bg-zinc-900 text-white hover:bg-zinc-800"
              >
                {mode === "portal"
                  ? person
                    ? `Opslaan (${state.valid_days.length} dagen)`
                    : `Indienen (${state.valid_days.length} dagen)`
                  : person
                  ? isApproved
                    ? `Opslaan (${state.valid_days.length} dagen)`
                    : `Opslaan & goedkeuren (${state.valid_days.length} dagen)`
                  : `Toevoegen (${state.valid_days.length} dagen)`}
              </Button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  )
}

// ===== helpers =====

function personToState(person: EnrichedCrew | null, fallbackId: string): FormState {
  if (!person) {
    return {
      id: fallbackId,
      first_name: "",
      last_name: "",
      email: "",
      role: "",
      notes: "",
      valid_days: [],
      zone_ids: [],
      meal_selections: {},
      perPersonItems: new Map(),
      perDayItems: new Map(),
    }
  }

  const perPerson = new Map<
    string,
    { enabled: boolean; quantity: number; selected_variant?: string }
  >()
  const perDay = new Map<
    string,
    Record<string, { enabled: boolean; selected_variant?: string }>
  >()

  person.items.forEach((it) => {
    if (it.type.scope === "per_person") {
      perPerson.set(it.item_type_id, {
        enabled: true,
        quantity: it.quantity,
        selected_variant: it.selected_variant,
      })
    } else if (it.day) {
      const cur = perDay.get(it.item_type_id) ?? {}
      cur[it.day] = { enabled: true, selected_variant: it.selected_variant }
      perDay.set(it.item_type_id, cur)
    }
  })

  return {
    id: person.id,
    first_name: person.first_name,
    last_name: person.last_name,
    email: person.email ?? "",
    role: person.role ?? "",
    notes: person.notes ?? "",
    valid_days: person.valid_days,
    zone_ids: person.zone_ids,
    meal_selections: person.meal_selections,
    perPersonItems: perPerson,
    perDayItems: perDay,
  }
}

function Field({
  label,
  required,
  className,
  error,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  )
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3
      className={cn(
        "mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        className
      )}
    >
      {children}
    </h3>
  )
}

function PresetButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
    >
      {children}
    </button>
  )
}

function DayKindBadge({ build }: { build: boolean }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        build ? "bg-amber-50 text-amber-700" : "bg-zinc-900 text-white"
      )}
    >
      {build ? "OB" : "SH"}
    </span>
  )
}

function GroupTypeChip({ type }: { type: Group["type"] }) {
  const cfg: Record<Group["type"], { label: string; cls: string }> = {
    crew: { label: "Crew", cls: "bg-blue-100 text-blue-700" },
    artist: { label: "Artiest", cls: "bg-violet-100 text-violet-700" },
    supplier: { label: "Leverancier", cls: "bg-amber-100 text-amber-800" },
    press: { label: "Pers", cls: "bg-emerald-100 text-emerald-800" },
    vip: { label: "VIP", cls: "bg-purple-100 text-purple-800" },
    other: { label: "Overig", cls: "bg-zinc-100 text-zinc-700" },
  }
  const c = cfg[type]
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        c.cls
      )}
    >
      {c.label}
    </span>
  )
}

function StatusChip({
  status,
}: {
  status: "draft" | "approved" | "rejected" | "checked_in" | "checked_out"
}) {
  const cfg: Record<typeof status, { label: string; cls: string }> = {
    draft: { label: "Aangevraagd", cls: "bg-zinc-100 text-zinc-700" },
    approved: { label: "Goedgekeurd", cls: "bg-emerald-100 text-emerald-800" },
    rejected: { label: "Afgewezen", cls: "bg-red-100 text-red-800" },
    checked_in: { label: "Ingecheckt", cls: "bg-blue-100 text-blue-800" },
    checked_out: { label: "Uitgecheckt", cls: "bg-zinc-100 text-zinc-500" },
  }
  const c = cfg[status]
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        c.cls
      )}
    >
      {c.label}
    </span>
  )
}
