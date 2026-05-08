"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ZoneBadge } from "@/components/accreditation/ZoneBadge"
import {
  accreditationActions,
  usePersons,
  useZones,
} from "@/lib/store/accreditation-store"
import { showToast } from "@/components/accreditation/Toast"
import { PROJECT_ID } from "@/lib/mock/data"
import type { Zone } from "@/types/accreditation"

const PALETTE = [
  "#7c3aed",
  "#dc2626",
  "#f59e0b",
  "#0ea5e9",
  "#10b981",
  "#ec4899",
  "#6366f1",
  "#84cc16",
  "#06b6d4",
  "#f97316",
]

export function ZonesClient() {
  const zones = useZones()
  const persons = usePersons()
  const [editing, setEditing] = useState<Zone | null>(null)
  const [creating, setCreating] = useState(false)

  const counts = useMemo(
    () =>
      zones.map((z) => ({
        ...z,
        used: persons.filter((p) => p.zone_ids.includes(z.id)).length,
      })),
    [zones, persons]
  )

  const removeZone = (z: Zone) => {
    if (!confirm(`Zone "${z.name}" verwijderen?`)) return
    accreditationActions.deleteZone(z.id)
    showToast(`Zone "${z.name}" verwijderd`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Zones</h2>
          <p className="text-sm text-muted-foreground">
            Toegangszones met kleur en capaciteit.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Zone toevoegen
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {counts.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nog geen zones.
          </div>
        ) : (
          <ul className="divide-y">
            {counts.map((z) => {
              const occupancy = z.capacity ? z.used / z.capacity : 0
              return (
                <li
                  key={z.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50"
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-base font-bold text-white ring-1 ring-zinc-300"
                    style={{ backgroundColor: z.color }}
                  >
                    {z.number ?? "—"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{z.name}</span>
                      <ZoneBadge name={z.name} color={z.color} />
                    </div>
                    <code className="font-mono text-[10px] text-muted-foreground">
                      Bandje-nummer{" "}
                      <strong className="text-foreground">{z.number ?? "—"}</strong>{" "}
                      · {z.color}
                    </code>
                  </div>
                  <div className="text-right">
                    <div className="text-sm tabular-nums">
                      {z.used}
                      {z.capacity && (
                        <span className="text-muted-foreground">
                          {" "}
                          / {z.capacity}
                        </span>
                      )}
                    </div>
                    {z.capacity && (
                      <div className="mt-1 h-1 w-24 overflow-hidden rounded bg-zinc-100">
                        <div
                          className="h-full bg-zinc-400"
                          style={{
                            width: `${Math.min(100, Math.round(occupancy * 100))}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditing(z)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => removeZone(z)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ZoneFormDialog
        open={creating || editing !== null}
        zone={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function ZoneFormDialog({
  open,
  zone,
  onClose,
}: {
  open: boolean
  zone: Zone | null
  onClose: () => void
}) {
  const zones = useZones()
  const [name, setName] = useState("")
  const [color, setColor] = useState(PALETTE[0])
  const [capacity, setCapacity] = useState<string>("")
  const [zoneNumber, setZoneNumber] = useState<string>("")

  useEffect(() => {
    if (!open) return
    if (zone) {
      setName(zone.name)
      setColor(zone.color)
      setCapacity(zone.capacity ? String(zone.capacity) : "")
      setZoneNumber(zone.number ? String(zone.number) : "")
    } else {
      setName("")
      setColor(PALETTE[0])
      setCapacity("")
      setZoneNumber(String(zones.length + 1))
    }
  }, [open, zone, zones.length])

  if (!open) return null

  const submit = () => {
    if (!name.trim()) return
    const next: Zone = {
      id: zone?.id ?? Math.random().toString(36).slice(2),
      project_id: zone?.project_id ?? PROJECT_ID,
      name: name.trim(),
      color,
      capacity: capacity ? parseInt(capacity) : undefined,
      sort_order: zone?.sort_order ?? zones.length,
      number: zoneNumber ? parseInt(zoneNumber) : undefined,
    }
    accreditationActions.upsertZone(next)
    showToast(zone ? `Zone "${next.name}" bijgewerkt` : `Zone "${next.name}" aangemaakt`)
    setName("")
    setColor(PALETTE[0])
    setCapacity("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-semibold">{zone ? "Zone bewerken" : "Nieuwe zone"}</h2>
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
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Kleur
            </Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-7 rounded-md ring-1 transition-all ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-zinc-900"
                      : "ring-zinc-300"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-7 cursor-pointer rounded-md border"
              />
            </div>
            <code className="mt-1 inline-block font-mono text-[10px] text-muted-foreground">
              {color}
            </code>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Bandje-nummer
              </Label>
              <Input
                type="number"
                min={1}
                value={zoneNumber}
                onChange={(e) => setZoneNumber(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Zichtbaar op gedrukte bandjes.
              </p>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Capaciteit (optioneel)
              </Label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="mt-1"
              />
            </div>
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
            {zone ? "Opslaan" : "Aanmaken"}
          </Button>
        </footer>
      </div>
    </div>
  )
}
