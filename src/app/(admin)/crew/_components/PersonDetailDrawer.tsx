"use client"

import { useEffect } from "react"
import { X, Mail, BadgeCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/accreditation/StatusBadge"
import { ZoneBadge } from "@/components/accreditation/ZoneBadge"
import { GroupTypeBadge } from "@/components/accreditation/RoleBadge"
import { DayChip } from "@/components/accreditation/DayChip"
import { dayType } from "@/lib/mock/data"
import { accreditationActions } from "@/lib/store/accreditation-store"
import { showToast } from "@/components/accreditation/Toast"
import type {
  Person,
  Group,
  Zone,
  ItemType,
  PersonItem,
} from "@/types/accreditation"

type EnrichedPerson = Omit<Person, "items"> & {
  items: PersonItem[]
  group: Group
  zones: Zone[]
  itemDetails: Array<PersonItem & { type: ItemType }>
}

export function PersonDetailDrawer({
  person,
  allDays,
  onClose,
}: {
  person: EnrichedPerson | null
  allDays: string[]
  onClose: () => void
}) {
  useEffect(() => {
    if (!person) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [person, onClose])

  if (!person) return null

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-6 py-4 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Persoon
            </div>
            <h3 className="text-lg font-semibold tracking-tight">
              {person.first_name} {person.last_name}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">Sluiten</span>
          </Button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <section className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={person.status} />
              <GroupTypeBadge type={person.group.type} />
              <span className="text-sm text-muted-foreground">
                · {person.group.name}
              </span>
            </div>
            {person.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-3.5" />
                {person.email}
              </div>
            )}
            {person.role && (
              <div className="text-sm text-muted-foreground">
                Rol: <span className="text-foreground">{person.role}</span>
              </div>
            )}
          </section>

          <section>
            <h4 className="text-sm font-semibold text-foreground">Dagen</h4>
            <p className="mb-2 text-xs text-muted-foreground">
              Aangevraagde dagen → goedgekeurde dagen
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allDays.map((day) => {
                const requested = person.valid_days.includes(day)
                const approved = person.approved_days.includes(day)
                return (
                  <DayChip
                    key={day}
                    date={day}
                    kind={dayType(day)}
                    state={
                      approved
                        ? "approved"
                        : requested
                        ? "selected"
                        : "disabled"
                    }
                  />
                )
              })}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-foreground">Zones</h4>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {person.zones.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Geen zones toegekend
                </span>
              ) : (
                person.zones.map((z) => (
                  <ZoneBadge key={z.id} name={z.name} color={z.color} />
                ))
              )}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-foreground">Items</h4>
            {person.itemDetails.length === 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Geen items aangevraagd.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {person.itemDetails.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between rounded-md border bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {it.type.color ? (
                        <span
                          className="size-3 rounded-sm ring-1 ring-zinc-300"
                          style={{ backgroundColor: it.type.color }}
                        />
                      ) : null}
                      <span className="font-medium">{it.type.name}</span>
                      {it.selected_variant ? (
                        <span className="text-xs text-muted-foreground">
                          · {it.selected_variant}
                        </span>
                      ) : null}
                      {it.day ? (
                        <span className="text-xs text-muted-foreground">
                          · {new Date(it.day).toLocaleDateString("nl-NL", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {it.quantity}×
                      </span>
                      {it.issued ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          <BadgeCheck className="size-3" /> Uitgegeven
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                          <AlertCircle className="size-3" /> Open
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="text-sm font-semibold text-foreground">Maaltijden</h4>
            {Object.keys(person.meal_selections).length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Geen maaltijden aangevraagd.
              </p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {Object.entries(person.meal_selections)
                  .filter(([, ms]) => (ms as string[]).length > 0)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([day, meals]) => {
                    const ms = meals as string[]
                    const labels: Record<string, string> = {
                      breakfast: "Ontbijt",
                      lunch: "Lunch",
                      dinner: "Diner",
                      nightsnack: "Nachtsnack",
                    }
                    return (
                      <div
                        key={day}
                        className="flex flex-wrap items-center gap-2 rounded-md border bg-zinc-50/50 px-3 py-1.5"
                      >
                        <span className="text-xs font-medium capitalize text-zinc-700">
                          {new Date(day).toLocaleDateString("nl-NL", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(["breakfast", "lunch", "dinner", "nightsnack"] as const)
                            .filter((m) => ms.includes(m))
                            .map((m) => (
                              <span
                                key={m}
                                className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white"
                              >
                                {labels[m]}
                              </span>
                            ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </section>

          <section>
            <h4 className="text-sm font-semibold text-foreground">QR</h4>
            <code className="mt-1 inline-block rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs">
              {person.qr_token}
            </code>
          </section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background px-6 py-3">
          {person.status === "draft" ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  accreditationActions.rejectPerson(person.id)
                  onClose()
                }}
              >
                Afwijzen
              </Button>
              <Button
                onClick={() => {
                  accreditationActions.approvePerson(person.id, person.valid_days)
                  onClose()
                }}
              >
                Goedkeuren ({person.valid_days.length} dagen)
              </Button>
            </>
          ) : (
            <>
              {person.status === "approved" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    accreditationActions.checkInPerson(person.id)
                    showToast(
                      `${person.first_name} ${person.last_name} ingecheckt`
                    )
                  }}
                >
                  Handmatige check-in
                </Button>
              )}
              {person.status === "checked_in" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    accreditationActions.checkOutPerson(person.id)
                    showToast(
                      `${person.first_name} ${person.last_name} uitgecheckt`
                    )
                  }}
                >
                  Check-out
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    confirm(
                      "Nieuwe QR-token genereren? Het oude ticket werkt daarna niet meer."
                    )
                  ) {
                    accreditationActions.regenerateQrToken(person.id)
                    showToast("Nieuwe QR-token gegenereerd")
                  }
                }}
              >
                Nieuwe QR
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={`/accreditation/ticket/${person.qr_token}`}
                  target="_blank"
                >
                  Open ticket
                </a>
              </Button>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
