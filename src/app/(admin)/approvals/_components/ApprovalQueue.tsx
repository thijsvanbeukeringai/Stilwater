"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, X, ChevronDown, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ZoneBadge } from "@/components/accreditation/ZoneBadge"
import { GroupTypeBadge } from "@/components/accreditation/RoleBadge"
import { DayChip } from "@/components/accreditation/DayChip"
import { Kbd } from "@/components/accreditation/KeyboardHint"
import { dayType, dayLabel } from "@/lib/mock/data"
import { accreditationActions } from "@/lib/store/accreditation-store"
import type {
  Person,
  Group,
  Zone,
  ItemType,
  PersonItem,
} from "@/types/accreditation"

type EnrichedPerson = Omit<Person, "items"> & {
  group: Group
  zones: Zone[]
  items: Array<PersonItem & { type: ItemType }>
}

type ToastMsg = { id: string; tone: "success" | "warning"; text: string }

const MEAL_LABEL = {
  breakfast: "Ontbijt",
  lunch: "Lunch",
  dinner: "Diner",
  nightsnack: "Nachtsnack",
} as const

export function ApprovalQueue({
  queue,
  allDays,
}: {
  queue: EnrichedPerson[]
  allDays: string[]
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  // Clamp active index when queue shrinks
  useEffect(() => {
    if (activeIdx >= queue.length && queue.length > 0) {
      setActiveIdx(queue.length - 1)
    }
  }, [queue.length, activeIdx])

  const active = queue[activeIdx] ?? null

  const pushToast = (tone: ToastMsg["tone"], text: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, tone, text }])
    setTimeout(() => setToasts((t) => t.filter((tt) => tt.id !== id)), 3000)
  }

  const approve = () => {
    if (!active) return
    pushToast(
      "success",
      `${active.first_name} ${active.last_name} goedgekeurd voor ${active.valid_days.length} dagen`
    )
    accreditationActions.approvePerson(active.id, active.valid_days)
    // queue update happens via store subscription; activeIdx clamped above
  }

  const reject = () => {
    if (!active) return
    pushToast("warning", `${active.first_name} ${active.last_name} afgewezen`)
    accreditationActions.rejectPerson(active.id)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return
      switch (e.key.toLowerCase()) {
        case "j":
          e.preventDefault()
          setActiveIdx((i) => Math.min(i + 1, queue.length - 1))
          break
        case "k":
          e.preventDefault()
          setActiveIdx((i) => Math.max(i - 1, 0))
          break
        case "a":
          e.preventDefault()
          approve()
          break
        case "r":
          e.preventDefault()
          reject()
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [queue, activeIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  const groupedTotals = useMemo(() => {
    const m = new Map<string, number>()
    queue.forEach((p) => m.set(p.group.name, (m.get(p.group.name) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [queue])

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <Check className="mx-auto size-10 text-emerald-500" />
        <h3 className="mt-3 text-lg font-semibold">Queue is leeg</h3>
        <p className="text-sm text-muted-foreground">
          Geen pending personen meer. Goed werk.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
      {/* List column */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pending ({queue.length})</h3>
            <span className="text-xs text-muted-foreground">
              {groupedTotals.length} groepen
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {groupedTotals.map(([name, n]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-700"
              >
                {name} <span className="font-mono">{n}</span>
              </span>
            ))}
          </div>
        </div>
        <ul className="max-h-[calc(100vh-260px)] overflow-y-auto">
          {queue.map((p, i) => (
            <li key={p.id}>
              <button
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50",
                  i === activeIdx &&
                    "bg-blue-50 ring-2 ring-inset ring-blue-300"
                )}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                  {p.first_name[0]}
                  {p.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">
                      {p.first_name} {p.last_name}
                    </span>
                    <GroupTypeBadge type={p.group.type} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.group.name}
                    {p.role ? ` · ${p.role}` : ""}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {p.valid_days.length} dagen aangevraagd
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Detail column */}
      <div className="rounded-xl border bg-card shadow-sm">
        {active && (
          <>
            <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {active.first_name} {active.last_name}
                  </h3>
                  <GroupTypeBadge type={active.group.type} />
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{active.group.name}</span>
                  {active.role && <span>· {active.role}</span>}
                  {active.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5" />
                      {active.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
                <span>
                  {activeIdx + 1} van {queue.length}
                </span>
                <ChevronDown className="size-3.5" />
              </div>
            </div>

            <div className="space-y-6 px-6 py-5">
              <section>
                <h4 className="text-sm font-semibold text-foreground">
                  Aangevraagde dagen ({active.valid_days.length})
                </h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {active.valid_days.map((d) => (
                    <DayChip
                      key={d}
                      date={d}
                      kind={dayType(d)}
                      state="selected"
                      size="md"
                    />
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-foreground">Zones</h4>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {active.zones.map((z) => (
                    <ZoneBadge key={z.id} name={z.name} color={z.color} />
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-foreground">Items</h4>
                <ul className="mt-2 space-y-1.5">
                  {active.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {it.type.color && (
                          <span
                            className="size-3 rounded-sm ring-1 ring-zinc-300"
                            style={{ backgroundColor: it.type.color }}
                          />
                        )}
                        <span className="font-medium">{it.type.name}</span>
                        {it.selected_variant && (
                          <span className="text-xs text-muted-foreground">
                            · {it.selected_variant}
                          </span>
                        )}
                        {it.day && (
                          <span className="text-xs text-muted-foreground">
                            · {dayLabel(it.day)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {it.quantity}×
                      </span>
                    </li>
                  ))}
                  {active.items.length === 0 && (
                    <li className="text-xs text-muted-foreground">
                      Geen items aangevraagd.
                    </li>
                  )}
                </ul>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-foreground">
                  Maaltijden per dag
                </h4>
                {Object.keys(active.meal_selections).length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Geen maaltijden aangevraagd.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {active.valid_days
                      .filter(
                        (d) => (active.meal_selections[d] ?? []).length > 0
                      )
                      .sort()
                      .map((day) => {
                        const meals = (active.meal_selections[day] ?? []) as string[]
                        return (
                          <div
                            key={day}
                            className="flex flex-wrap items-center gap-2 rounded-md border bg-white px-3 py-2"
                          >
                            <span className="text-xs font-semibold capitalize text-zinc-700">
                              {dayLabel(day)}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {(["breakfast", "lunch", "dinner", "nightsnack"] as const)
                                .filter((m) => meals.includes(m))
                                .map((m) => (
                                  <span
                                    key={m}
                                    className="inline-flex items-center rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white"
                                  >
                                    {MEAL_LABEL[m]}
                                  </span>
                                ))}
                            </div>
                            <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                              {meals.length}×
                            </span>
                          </div>
                        )
                      })}
                    <div className="text-[11px] text-muted-foreground">
                      Totaal:{" "}
                      <strong>
                        {Object.values(active.meal_selections).reduce(
                          (acc, ms) => acc + (ms as string[]).length,
                          0
                        )}
                      </strong>{" "}
                      maaltijden over{" "}
                      {Object.keys(active.meal_selections).length} dagen
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="flex items-center justify-between gap-3 border-t bg-zinc-50/50 px-6 py-3">
              <div className="hidden gap-3 text-xs text-muted-foreground md:flex">
                <span className="inline-flex items-center gap-1">
                  <Kbd>J</Kbd>/<Kbd>K</Kbd> nav
                </span>
                <span className="inline-flex items-center gap-1">
                  <Kbd>A</Kbd> approve
                </span>
                <span className="inline-flex items-center gap-1">
                  <Kbd>R</Kbd> reject
                </span>
              </div>
              <div className="flex flex-1 justify-end gap-2">
                <Button variant="outline" onClick={reject}>
                  <X className="size-4" />
                  Afwijzen
                </Button>
                <Button onClick={approve}>
                  <Check className="size-4" />
                  Goedkeuren ({active.valid_days.length} dagen)
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast stack */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-md border bg-card px-4 py-2 text-sm shadow-lg ring-1",
              t.tone === "success" && "ring-emerald-300",
              t.tone === "warning" && "ring-amber-300"
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
