"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Tag, Car, Radio, Package, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  accreditationActions,
  useItemTypes,
  usePersons,
  useProject,
} from "@/lib/store/accreditation-store"
import { showToast } from "@/components/accreditation/Toast"
import type {
  Group,
  ItemCategory,
  ItemLimitValue,
  ItemType,
} from "@/types/accreditation"

const CATEGORY_META: Record<
  ItemCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  wristband: { label: "Polsbandjes", icon: Tag },
  parking: { label: "Parkeerkaarten", icon: Car },
  equipment: { label: "Equipment", icon: Radio },
  other: { label: "Overig", icon: Package },
}

type ItemLimitState = {
  enabled: boolean // false = niet beschikbaar voor dit bedrijf
  perVariant: boolean // true = per-variant beheren, alleen relevant als item.variants.length > 0
  total: string // string in input; geparsed bij save
  variants: Record<string, string> // per variant max
  variantsEnabled: Record<string, boolean> // per variant beschikbaar
}

const buildState = (it: ItemType, value: ItemLimitValue | undefined): ItemLimitState => {
  if (value === undefined) {
    return {
      enabled: false,
      perVariant: false,
      total: "",
      variants: Object.fromEntries(it.variants.map((v) => [v, ""])),
      variantsEnabled: Object.fromEntries(it.variants.map((v) => [v, false])),
    }
  }
  if (typeof value === "number") {
    return {
      enabled: value > 0,
      perVariant: false,
      total: String(value),
      variants: Object.fromEntries(it.variants.map((v) => [v, ""])),
      variantsEnabled: Object.fromEntries(it.variants.map((v) => [v, false])),
    }
  }
  // per-variant Record
  const variants: Record<string, string> = {}
  const variantsEnabled: Record<string, boolean> = {}
  it.variants.forEach((v) => {
    const n = value[v] ?? 0
    variants[v] = n > 0 ? String(n) : ""
    variantsEnabled[v] = n > 0
  })
  return {
    enabled: Object.values(variantsEnabled).some((b) => b),
    perVariant: true,
    total: "",
    variants,
    variantsEnabled,
  }
}

const stateToValue = (it: ItemType, s: ItemLimitState): ItemLimitValue | null => {
  if (!s.enabled) return null
  if (s.perVariant && it.variants.length > 0) {
    const out: Record<string, number> = {}
    it.variants.forEach((v) => {
      if (!s.variantsEnabled[v]) return
      const n = parseInt(s.variants[v]) || 0
      if (n > 0) out[v] = n
    })
    if (Object.keys(out).length === 0) return null
    return out
  }
  const n = parseInt(s.total) || 0
  if (n <= 0) return null
  return n
}

export function CompanyLimitsDialog({
  open,
  company,
  onClose,
}: {
  open: boolean
  company: Group
  onClose: () => void
}) {
  const itemTypes = useItemTypes()
  const persons = usePersons()
  const project = useProject()
  const [items, setItems] = useState<Record<string, ItemLimitState>>({})
  const [maxPersons, setMaxPersons] = useState<string>("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    const initial: Record<string, ItemLimitState> = {}
    const exp = new Set<string>()
    itemTypes.forEach((it) => {
      const v = company.item_limits[it.id]
      initial[it.id] = buildState(it, v)
      // Auto-expand items that are enabled
      if (initial[it.id].enabled) exp.add(it.id)
    })
    setItems(initial)
    setExpanded(exp)
    setMaxPersons(company.max_persons ? String(company.max_persons) : "")
  }, [open, company, itemTypes])

  const usage = useMemo(() => {
    const totalsByItem = new Map<string, number>()
    const totalsByVariant = new Map<string, Map<string, number>>()
    persons
      .filter((p) => p.group_id === company.id)
      .forEach((p) =>
        p.items.forEach((it) => {
          totalsByItem.set(
            it.item_type_id,
            (totalsByItem.get(it.item_type_id) ?? 0) + it.quantity
          )
          if (it.selected_variant) {
            const m = totalsByVariant.get(it.item_type_id) ?? new Map()
            m.set(
              it.selected_variant,
              (m.get(it.selected_variant) ?? 0) + it.quantity
            )
            totalsByVariant.set(it.item_type_id, m)
          }
        })
      )
    return { totalsByItem, totalsByVariant }
  }, [persons, company.id])

  if (!open) return null

  const grouped = (
    ["wristband", "parking", "equipment", "other"] as ItemCategory[]
  )
    .map((cat) => ({
      category: cat,
      items: itemTypes.filter((it) => it.category === cat),
    }))
    .filter((g) => g.items.length > 0)
    // Bij Zebra-print zijn wristband-types uit de pool niet relevant —
    // het bandje wordt per persoon geprint.
    .filter(
      (g) =>
        g.category !== "wristband" ||
        project.wristband_strategy !== "zebra_print"
    )

  const submit = () => {
    const newLimits: Record<string, ItemLimitValue> = {}
    itemTypes.forEach((it) => {
      const v = stateToValue(it, items[it.id])
      if (v !== null) newLimits[it.id] = v
    })
    accreditationActions.upsertGroup({
      ...company,
      item_limits: newLimits,
      max_persons: maxPersons ? parseInt(maxPersons) || undefined : undefined,
    })
    showToast(`Limieten voor ${company.name} bijgewerkt`)
    onClose()
  }

  const updateItem = (id: string, patch: Partial<ItemLimitState>) =>
    setItems((s) => ({ ...s, [id]: { ...s[id], ...patch } }))

  const toggleExpanded = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/50" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Limieten — {company.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Stel in welke items dit bedrijf mag aanvragen en hoeveel — per
              item óf per variant.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 rounded-md border bg-zinc-50/50 p-3">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Maximum aantal crewleden
            </Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={maxPersons}
                onChange={(e) => setMaxPersons(e.target.value)}
                placeholder="Onbeperkt"
                className="max-w-[140px]"
              />
              <span className="text-xs text-muted-foreground">
                Nu: {persons.filter((p) => p.group_id === company.id).length}
              </span>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Polsband-strategie staat ingesteld op project-niveau via{" "}
              <strong>Instellingen</strong> in de zijbalk —{" "}
              {project.wristband_strategy === "zebra_print"
                ? "Zebra-print actief, bandjes worden per persoon geprint."
                : "Voorgedrukt actief, kies hieronder welk type uit de pool."}
            </p>
          </div>

          {grouped.map(({ category, items: catItems }) => {
            const meta = CATEGORY_META[category]
            const Icon = meta.icon
            return (
              <section key={category} className="mb-4">
                <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon className="size-3.5" />
                  {meta.label}
                </h3>
                <div className="overflow-hidden rounded-md border">
                  <ul className="divide-y">
                    {catItems.map((it) => {
                      const s = items[it.id]
                      if (!s) return null
                      const hasVariants = it.variants.length > 0
                      const isExpanded = expanded.has(it.id)
                      const used = usage.totalsByItem.get(it.id) ?? 0
                      return (
                        <li key={it.id} className={cn(!s.enabled && "bg-zinc-50/40")}>
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <Checkbox
                              checked={s.enabled}
                              onCheckedChange={(v) => {
                                updateItem(it.id, { enabled: !!v })
                                if (v) setExpanded((x) => new Set(x).add(it.id))
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => s.enabled && toggleExpanded(it.id)}
                              className="flex flex-1 items-center gap-2 text-left"
                              disabled={!s.enabled}
                            >
                              {it.color && (
                                <span
                                  className="size-2.5 rounded-sm ring-1 ring-zinc-300"
                                  style={{ backgroundColor: it.color }}
                                />
                              )}
                              <span className="font-medium">{it.name}</span>
                              <span className="rounded bg-zinc-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-700">
                                {it.scope === "per_day" ? "Per dag" : "Per persoon"}
                              </span>
                              {hasVariants && s.enabled && (
                                <span className="text-xs text-muted-foreground">
                                  {s.perVariant
                                    ? "per variant"
                                    : "totaal voor alle varianten"}
                                </span>
                              )}
                            </button>
                            {s.enabled && (
                              <>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {used} in gebruik
                                </span>
                                {hasVariants && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(it.id)}
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
                              </>
                            )}
                          </div>

                          {s.enabled && (isExpanded || !hasVariants) && (
                            <div className="border-t bg-zinc-50/30 px-10 py-3">
                              {hasVariants && (
                                <div className="mb-3 flex items-center gap-3 text-xs">
                                  <span className="font-medium text-muted-foreground">
                                    Beheermodus:
                                  </span>
                                  <label className="flex cursor-pointer items-center gap-1.5">
                                    <input
                                      type="radio"
                                      name={`mode-${it.id}`}
                                      checked={!s.perVariant}
                                      onChange={() =>
                                        updateItem(it.id, { perVariant: false })
                                      }
                                    />
                                    Eén totaal
                                  </label>
                                  <label className="flex cursor-pointer items-center gap-1.5">
                                    <input
                                      type="radio"
                                      name={`mode-${it.id}`}
                                      checked={s.perVariant}
                                      onChange={() =>
                                        updateItem(it.id, { perVariant: true })
                                      }
                                    />
                                    Per variant
                                  </label>
                                </div>
                              )}

                              {!s.perVariant || !hasVariants ? (
                                <div className="flex items-center gap-3">
                                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                    Maximum aantal
                                  </Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={s.total}
                                    onChange={(e) =>
                                      updateItem(it.id, { total: e.target.value })
                                    }
                                    className="h-8 w-24 text-right"
                                  />
                                </div>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-muted-foreground">
                                      <th className="pb-1 text-left font-medium">
                                        Beschikbaar
                                      </th>
                                      <th className="pb-1 text-left font-medium">
                                        Variant
                                      </th>
                                      <th className="pb-1 text-right font-medium">
                                        Max
                                      </th>
                                      <th className="pb-1 text-right font-medium">
                                        In gebruik
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {it.variants.map((v) => {
                                      const variantOn = s.variantsEnabled[v]
                                      const variantUsed =
                                        usage.totalsByVariant
                                          .get(it.id)
                                          ?.get(v) ?? 0
                                      const variantMax =
                                        parseInt(s.variants[v]) || 0
                                      const over =
                                        variantOn &&
                                        variantMax > 0 &&
                                        variantUsed > variantMax
                                      return (
                                        <tr
                                          key={v}
                                          className={cn(
                                            !variantOn && "opacity-50"
                                          )}
                                        >
                                          <td className="py-1">
                                            <Checkbox
                                              checked={variantOn}
                                              onCheckedChange={(b) =>
                                                updateItem(it.id, {
                                                  variantsEnabled: {
                                                    ...s.variantsEnabled,
                                                    [v]: !!b,
                                                  },
                                                })
                                              }
                                            />
                                          </td>
                                          <td className="py-1 font-medium">
                                            {v}
                                          </td>
                                          <td className="py-1 text-right">
                                            <Input
                                              type="number"
                                              min={0}
                                              disabled={!variantOn}
                                              value={s.variants[v]}
                                              onChange={(e) =>
                                                updateItem(it.id, {
                                                  variants: {
                                                    ...s.variants,
                                                    [v]: e.target.value,
                                                  },
                                                })
                                              }
                                              className="ml-auto h-7 w-20 text-right"
                                            />
                                          </td>
                                          <td className="py-1 text-right tabular-nums">
                                            <span
                                              className={cn(
                                                over &&
                                                  "font-bold text-red-600"
                                              )}
                                            >
                                              {variantUsed}
                                            </span>
                                            {variantOn && variantMax > 0 && (
                                              <span className="text-muted-foreground">
                                                {" "}
                                                / {variantMax}
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </section>
            )
          })}
        </div>

        <footer className="flex justify-end gap-2 border-t bg-zinc-50/50 px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button
            onClick={submit}
            className="bg-zinc-900 text-white hover:bg-zinc-800"
          >
            Limieten opslaan
          </Button>
        </footer>
      </div>
    </div>
  )
}
