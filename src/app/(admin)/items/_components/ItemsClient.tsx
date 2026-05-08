"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Package, Tag, Car, Radio, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  accreditationActions,
  useItemTypes,
  usePersons,
} from "@/lib/store/accreditation-store"
import { showToast } from "@/components/accreditation/Toast"
import { PROJECT_ID } from "@/lib/mock/data"
import { cn } from "@/lib/utils"
import type { ItemCategory, ItemScope, ItemType } from "@/types/accreditation"

const CATEGORY_META: Record<
  ItemCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  wristband: { label: "Polsbandjes", icon: Tag, tone: "bg-rose-50 text-rose-700" },
  parking: { label: "Parkeren", icon: Car, tone: "bg-blue-50 text-blue-700" },
  equipment: {
    label: "Equipment",
    icon: Radio,
    tone: "bg-amber-50 text-amber-700",
  },
  other: { label: "Overig", icon: Package, tone: "bg-zinc-50 text-zinc-700" },
}

export function ItemsClient() {
  const itemTypes = useItemTypes()
  const persons = usePersons()
  const [editing, setEditing] = useState<ItemType | null>(null)
  const [creating, setCreating] = useState(false)

  const usage = useMemo(() => {
    const m = new Map<string, number>()
    persons.forEach((p) =>
      p.items.forEach((it) => {
        m.set(it.item_type_id, (m.get(it.item_type_id) ?? 0) + it.quantity)
      })
    )
    return m
  }, [persons])

  const grouped = (
    ["wristband", "equipment", "parking", "other"] as ItemCategory[]
  ).map((cat) => ({
    category: cat,
    items: itemTypes.filter((it) => it.category === cat),
  }))

  const removeItem = (it: ItemType) => {
    if (!confirm(`Item "${it.name}" verwijderen?`)) return
    accreditationActions.deleteItemType(it.id)
    showToast(`Item "${it.name}" verwijderd`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Items</h2>
          <p className="text-sm text-muted-foreground">
            Polsbandjes, parkeerkaarten, equipment en overige items.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Item toevoegen
        </Button>
      </div>

      {grouped
        .filter((g) => g.items.length > 0)
        .map(({ category, items }) => {
          const meta = CATEGORY_META[category]
          const Icon = meta.icon
          return (
            <section
              key={category}
              className="overflow-hidden rounded-lg border bg-card"
            >
              <div
                className={`flex items-center gap-2 border-b px-4 py-2 text-sm font-semibold ${meta.tone}`}
              >
                <Icon className="size-4" />
                {meta.label}
                <span className="text-xs font-normal opacity-70">
                  ({items.length})
                </span>
              </div>
              <ul className="divide-y">
                {items.map((it) => {
                  const used = usage.get(it.id) ?? 0
                  return (
                    <li
                      key={it.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md ring-1 ring-zinc-200">
                        {it.color ? (
                          <span
                            className="size-5 rounded-sm"
                            style={{ backgroundColor: it.color }}
                          />
                        ) : (
                          <Icon className="size-4 text-zinc-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{it.name}</span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              it.scope === "per_day"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-zinc-100 text-zinc-700"
                            )}
                          >
                            {it.scope === "per_day" ? "Per dag" : "Per persoon"}
                          </span>
                        </div>
                        {it.variants.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {it.variants.map((v) => (
                              <span
                                key={v}
                                className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm tabular-nums">
                        {used}
                        {it.total_available && (
                          <span className="text-muted-foreground">
                            {" "}
                            / {it.total_available}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditing(it)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(it)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

      <ItemFormDialog
        open={creating || editing !== null}
        item={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

const ITEM_PALETTE = [
  "#1f2937",
  "#dc2626",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#7c3aed",
  "#ec4899",
  "#84cc16",
]

function ItemFormDialog({
  open,
  item,
  onClose,
}: {
  open: boolean
  item: ItemType | null
  onClose: () => void
}) {
  const itemTypes = useItemTypes()
  const [name, setName] = useState("")
  const [category, setCategory] = useState<ItemCategory>("wristband")
  const [scope, setScope] = useState<ItemScope>("per_person")
  const [color, setColor] = useState<string>(ITEM_PALETTE[0])
  const [variantsText, setVariantsText] = useState("")
  const [total, setTotal] = useState<string>("")

  useEffect(() => {
    if (!open) return
    if (item) {
      setName(item.name)
      setCategory(item.category)
      setScope(item.scope)
      setColor(item.color ?? ITEM_PALETTE[0])
      setVariantsText(item.variants.join(", "))
      setTotal(item.total_available ? String(item.total_available) : "")
    } else {
      setName("")
      setCategory("wristband")
      setScope("per_person")
      setColor(ITEM_PALETTE[0])
      setVariantsText("")
      setTotal("")
    }
  }, [open, item])

  if (!open) return null

  const submit = () => {
    if (!name.trim()) return
    if (category === "wristband" && !color) {
      alert("Polsbandjes vereisen een kleur.")
      return
    }
    const next: ItemType = {
      id: item?.id ?? Math.random().toString(36).slice(2),
      project_id: item?.project_id ?? PROJECT_ID,
      name: name.trim(),
      category,
      scope,
      color: category === "wristband" || color !== ITEM_PALETTE[0] ? color : undefined,
      variants: variantsText
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      sort_order: item?.sort_order ?? itemTypes.length,
      total_available: total ? parseInt(total) : undefined,
    }
    accreditationActions.upsertItemType(next)
    showToast(item ? `Item "${next.name}" bijgewerkt` : `Item "${next.name}" aangemaakt`)
    onClose()
  }

  const CATS: ItemCategory[] = ["wristband", "equipment", "parking", "other"]
  const SCOPES: { v: ItemScope; label: string }[] = [
    { v: "per_person", label: "Per persoon" },
    { v: "per_day", label: "Per dag" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-semibold">{item ? "Item bewerken" : "Nieuw item"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>
        <div className="space-y-3 p-5">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Naam
            </Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              placeholder="bijv. Portofoon"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Categorie
            </Label>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {CATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium ring-1 transition-colors",
                    category === c
                      ? "bg-zinc-900 text-white ring-zinc-900"
                      : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  {CATEGORY_META[c].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Scope
            </Label>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {SCOPES.map((s) => (
                <button
                  key={s.v}
                  type="button"
                  onClick={() => setScope(s.v)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium ring-1 transition-colors",
                    scope === s.v
                      ? "bg-zinc-900 text-white ring-zinc-900"
                      : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {category === "wristband" && (
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Kleur (verplicht voor polsbandjes)
              </Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {ITEM_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "size-7 rounded-md ring-1 transition-all",
                      color === c
                        ? "ring-2 ring-offset-2 ring-zinc-900"
                        : "ring-zinc-300"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Varianten (komma-gescheiden, optioneel)
            </Label>
            <Input
              value={variantsText}
              onChange={(e) => setVariantsText(e.target.value)}
              className="mt-1"
              placeholder="bijv. Artist, Productie, Crew"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Totaal beschikbaar (optioneel)
            </Label>
            <Input
              type="number"
              min={1}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t bg-zinc-50/50 px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button
            className="bg-zinc-900 text-white hover:bg-zinc-800"
            onClick={submit}
          >
            {item ? "Opslaan" : "Aanmaken"}
          </Button>
        </footer>
      </div>
    </div>
  )
}
