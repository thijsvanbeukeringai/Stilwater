"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  accreditationActions,
  useZones,
} from "@/lib/store/accreditation-store"
import { showToast } from "@/components/accreditation/Toast"
import { PROJECT_ID } from "@/lib/mock/data"
import { cn } from "@/lib/utils"
import type { Group, GroupType } from "@/types/accreditation"

const TYPES: Array<{ value: GroupType; label: string }> = [
  { value: "crew", label: "Crew" },
  { value: "artist", label: "Artiest" },
  { value: "supplier", label: "Leverancier" },
  { value: "press", label: "Pers" },
  { value: "vip", label: "VIP" },
  { value: "other", label: "Overig" },
]

const newId = () => Math.random().toString(36).slice(2)
const newInviteToken = () =>
  `inv_${
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 28)
      : `${newId()}${newId()}`.slice(0, 28)
  }`

export function CompanyFormDialog({
  open,
  company,
  onClose,
}: {
  open: boolean
  company: Group | null
  onClose: () => void
}) {
  const zones = useZones()
  const [name, setName] = useState("")
  const [type, setType] = useState<GroupType>("crew")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [maxPersons, setMaxPersons] = useState<string>("")
  const [zoneIds, setZoneIds] = useState<string[]>([])
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  useEffect(() => {
    if (!open) return
    if (company) {
      setName(company.name)
      setType(company.type)
      setContactName(company.contact_name ?? "")
      setContactEmail(company.contact_email ?? "")
      setMaxPersons(company.max_persons ? String(company.max_persons) : "")
      setZoneIds(company.zone_ids ?? [])
    } else {
      setName("")
      setType("crew")
      setContactName("")
      setContactEmail("")
      setMaxPersons("")
      setZoneIds([])
    }
    setErrors({})
  }, [open, company])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = () => {
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = "Naam is verplicht"
    if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail))
      errs.email = "Ongeldig e-mailadres"
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const next: Group = {
      id: company?.id ?? newId(),
      project_id: company?.project_id ?? PROJECT_ID,
      name: name.trim(),
      type,
      contact_name: contactName.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      invite_token: company?.invite_token ?? newInviteToken(),
      item_limits: company?.item_limits ?? {},
      max_persons: maxPersons ? parseInt(maxPersons) : undefined,
      meal_config: company?.meal_config,
      zone_ids: zoneIds,
    }
    accreditationActions.upsertGroup(next)
    showToast(
      company
        ? `Bedrijf "${next.name}" bijgewerkt`
        : `Bedrijf "${next.name}" aangemaakt`
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold tracking-tight">
            {company ? "Bedrijf bewerken" : "Nieuw bedrijf"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>
        <div className="space-y-4 px-5 py-4">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Naam *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Catering Vermaat"
              autoFocus
              className="mt-1"
            />
            {errors.name && (
              <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
            )}
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Type
            </Label>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium ring-1 transition-colors ${
                    type === t.value
                      ? "bg-zinc-900 text-white ring-zinc-900"
                      : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Contact naam
              </Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Contact e-mail
              </Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Max. crewleden (optioneel)
            </Label>
            <Input
              type="number"
              min={1}
              value={maxPersons}
              onChange={(e) => setMaxPersons(e.target.value)}
              className="mt-1"
              placeholder="Onbeperkt"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Toegangszones
            </Label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Zones gelden voor alle crewleden van dit bedrijf — het bedrijf
              zelf kan dit niet wijzigen.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {zones.map((z, i) => {
                const selected = zoneIds.includes(z.id)
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() =>
                      setZoneIds((prev) =>
                        prev.includes(z.id)
                          ? prev.filter((x) => x !== z.id)
                          : [...prev, z.id]
                      )
                    }
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
              {zones.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  Nog geen zones gedefinieerd.
                </span>
              )}
            </div>
          </div>
        </div>
        <footer className="flex items-center justify-end gap-2 border-t bg-zinc-50/50 px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button
            className="bg-zinc-900 text-white hover:bg-zinc-800"
            onClick={submit}
          >
            {company ? "Opslaan" : "Aanmaken"}
          </Button>
        </footer>
      </div>
    </div>
  )
}
