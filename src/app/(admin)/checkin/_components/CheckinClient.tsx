"use client"

import { useMemo, useState } from "react"
import {
  ScanLine,
  Search,
  Check,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/accreditation/StatusBadge"
import { ZoneBadge } from "@/components/accreditation/ZoneBadge"
import { GroupTypeBadge } from "@/components/accreditation/RoleBadge"
import { dayLabel } from "@/lib/mock/data"
import { formatTime } from "@/lib/utils"
import {
  accreditationActions,
  usePersons,
  useProject,
} from "@/lib/store/accreditation-store"
import { WristbandPrintDialog } from "@/components/accreditation/WristbandPrintDialog"
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

type ScanState =
  | { kind: "idle" }
  | { kind: "success"; person: EnrichedPerson }
  | { kind: "duplicate"; person: EnrichedPerson }
  | { kind: "wrong_day"; person: EnrichedPerson }
  | { kind: "error"; message: string }

type Tab = "list" | "scan" | "history"

export function CheckinClient({
  persons,
  today,
}: {
  persons: EnrichedPerson[]
  today: string
}) {
  const allPersons = usePersons()
  const project = useProject()
  const [tab, setTab] = useState<Tab>("list")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"open" | "all" | "in">("open")
  const [scan, setScan] = useState<ScanState>({ kind: "idle" })
  const [manualToken, setManualToken] = useState("")
  const [printPerson, setPrintPerson] = useState<EnrichedPerson | null>(null)

  const counts = useMemo(() => {
    const total = persons.length
    const inn = persons.filter((p) => p.status === "checked_in").length
    return { total, inn }
  }, [persons])

  const visible = persons.filter((p) => {
    if (filter === "open" && p.status !== "approved") return false
    if (filter === "in" && p.status !== "checked_in") return false
    if (!query) return true
    const q = query.toLowerCase()
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q) ||
      p.group.name.toLowerCase().includes(q)
    )
  })

  const grouped = useMemo(() => {
    const m = new Map<string, EnrichedPerson[]>()
    visible.forEach((p) => {
      const arr = m.get(p.group.name) ?? []
      arr.push(p)
      m.set(p.group.name, arr)
    })
    return [...m.entries()]
  }, [visible])

  const checkIn = (p: EnrichedPerson) => {
    accreditationActions.checkInPerson(p.id)
    if (project.wristband_strategy === "zebra_print") {
      setPrintPerson(p)
    }
  }

  const undoCheckIn = (p: EnrichedPerson) => {
    accreditationActions.undoCheckIn(p.id)
  }

  const tryScan = (token: string) => {
    const trimmed = token.trim()
    if (!trimmed) return
    const raw = allPersons.find((p) => p.qr_token === trimmed)
    if (!raw) {
      setScan({ kind: "error", message: "Onbekende QR code." })
      return
    }
    const enriched = persons.find((x) => x.id === raw.id)
    if (!enriched) {
      setScan({
        kind: "wrong_day",
        person: {
          ...raw,
          group: { id: "", project_id: "", name: "—", type: "other", invite_token: "", item_limits: {} } as Group,
          zones: [],
          items: [],
        },
      })
      return
    }
    if (enriched.status === "checked_in") {
      setScan({ kind: "duplicate", person: enriched })
      return
    }
    if (!enriched.approved_days.includes(today)) {
      setScan({ kind: "wrong_day", person: enriched })
      return
    }
    checkIn(enriched)
    setScan({
      kind: "success",
      person: { ...enriched, status: "checked_in" },
    })
    setManualToken("")
  }

  return (
    <div className="space-y-4">
      {/* Header counts */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Vandaag
          </div>
          <div className="font-medium">{dayLabel(today)}</div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Ingecheckt
          </div>
          <div className="text-2xl font-semibold tabular-nums">
            {counts.inn}
            <span className="text-sm text-muted-foreground"> / {counts.total}</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Voortgang
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-zinc-100">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{
                width: `${Math.round(
                  counts.total === 0 ? 0 : (counts.inn / counts.total) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border bg-card p-1">
        {[
          { k: "list", label: "Lijst" },
          { k: "scan", label: "Scan" },
          { k: "history", label: "Geschiedenis" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as Tab)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === t.k
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek persoon…"
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {[
                { k: "open", label: "Niet ingecheckt" },
                { k: "in", label: "Ingecheckt" },
                { k: "all", label: "Alle" },
              ].map((f) => (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k as typeof filter)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    filter === f.k
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            {grouped.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Geen personen voor deze filters.
              </div>
            ) : (
              grouped.map(([groupName, ps]) => (
                <div key={groupName} className="border-b last:border-b-0">
                  <div className="bg-zinc-50/50 px-4 py-2 text-xs font-medium text-zinc-700">
                    {groupName} · {ps.length}
                  </div>
                  <ul>
                    {ps.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 border-t px-4 py-3 first:border-t-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                            {p.first_name[0]}
                            {p.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-medium">
                                {p.first_name} {p.last_name}
                              </span>
                              {p.role && (
                                <span className="text-xs text-muted-foreground">
                                  · {p.role}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {p.zones.slice(0, 3).map((z) => (
                                <ZoneBadge
                                  key={z.id}
                                  name={z.name}
                                  color={z.color}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {p.checked_in_at && (
                            <span className="hidden text-xs text-muted-foreground md:inline">
                              {formatTime(p.checked_in_at)}
                            </span>
                          )}
                          {p.status === "checked_in" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => undoCheckIn(p)}
                            >
                              Undo
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => checkIn(p)}>
                              <Check className="size-4" />
                              Check-in
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "scan" && (
        <ScanPanel
          state={scan}
          onScan={(t) => tryScan(t)}
          manualToken={manualToken}
          setManualToken={setManualToken}
          examples={allPersons.slice(0, 4).map((p) => ({
            qr: p.qr_token,
            label: `${p.first_name} ${p.last_name}`,
          }))}
        />
      )}

      {tab === "history" && <HistoryPanel persons={persons} />}

      <WristbandPrintDialog
        open={printPerson !== null}
        person={printPerson}
        group={printPerson?.group}
        zones={printPerson?.zones ?? []}
        project={project}
        onClose={() => setPrintPerson(null)}
        autoPrint
      />
    </div>
  )
}

function ScanPanel({
  state,
  onScan,
  manualToken,
  setManualToken,
  examples,
}: {
  state: ScanState
  onScan: (t: string) => void
  manualToken: string
  setManualToken: (s: string) => void
  examples: { qr: string; label: string }[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
      <div
        className={cn(
          "relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition-colors",
          state.kind === "success" && "border-emerald-500 bg-emerald-50",
          state.kind === "error" && "border-red-500 bg-red-50",
          state.kind === "duplicate" && "border-amber-500 bg-amber-50",
          state.kind === "wrong_day" && "border-orange-500 bg-orange-50",
          state.kind === "idle" && "border-zinc-300 bg-zinc-50"
        )}
      >
        {state.kind === "idle" && (
          <>
            <ScanLine className="size-12 text-zinc-400" />
            <p className="mt-4 text-sm text-zinc-500">
              Camera weergave (mock)
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              In productie: live videostream met overlay
            </p>
          </>
        )}
        {state.kind === "success" && (
          <>
            <Check className="size-12 text-emerald-600" />
            <h3 className="mt-2 text-2xl font-bold text-emerald-900">
              {state.person.first_name} {state.person.last_name} ingecheckt
            </h3>
            <p className="mt-1 text-sm text-emerald-800">
              {state.person.group.name}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {state.person.zones.map((z) => (
                <ZoneBadge key={z.id} name={z.name} color={z.color} />
              ))}
            </div>
          </>
        )}
        {state.kind === "duplicate" && (
          <>
            <Clock className="size-12 text-amber-600" />
            <h3 className="mt-2 text-xl font-bold text-amber-900">
              Al ingecheckt
            </h3>
            <p className="mt-1 text-sm text-amber-800">
              {state.person.first_name} {state.person.last_name} is al ingecheckt
              om{" "}
              {state.person.checked_in_at
                ? formatTime(state.person.checked_in_at)
                : "—"}
              .
            </p>
          </>
        )}
        {state.kind === "wrong_day" && (
          <>
            <AlertTriangle className="size-12 text-orange-600" />
            <h3 className="mt-2 text-xl font-bold text-orange-900">
              Niet geldig vandaag
            </h3>
            <p className="mt-1 text-sm text-orange-800">
              {state.person.first_name} {state.person.last_name} is niet
              goedgekeurd voor vandaag.
            </p>
          </>
        )}
        {state.kind === "error" && (
          <>
            <X className="size-12 text-red-600" />
            <h3 className="mt-2 text-xl font-bold text-red-900">
              Onbekende QR code
            </h3>
            <p className="mt-1 text-sm text-red-800">{state.message}</p>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">Handmatige invoer</h3>
          <p className="text-xs text-muted-foreground">
            Plak of typ een QR-token wanneer de camera niet werkt.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onScan(manualToken)
            }}
            className="mt-3 flex gap-2"
          >
            <Input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="qr_…"
              className="font-mono"
            />
            <Button type="submit">Check-in</Button>
          </form>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">Test tokens</h3>
          <p className="text-xs text-muted-foreground">
            Klik om een scan te simuleren.
          </p>
          <ul className="mt-2 space-y-1">
            {examples.map((ex) => (
              <li key={ex.qr}>
                <button
                  onClick={() => onScan(ex.qr)}
                  className="flex w-full items-center justify-between rounded border bg-zinc-50 px-2 py-1.5 text-left text-xs transition-colors hover:bg-zinc-100"
                >
                  <span className="font-medium">{ex.label}</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function HistoryPanel({ persons }: { persons: EnrichedPerson[] }) {
  const events = persons
    .filter((p) => p.checked_in_at || p.checked_out_at)
    .flatMap((p) => {
      const arr: { id: string; person: EnrichedPerson; ts: string; action: "in" | "out" }[] = []
      if (p.checked_in_at)
        arr.push({ id: `${p.id}-in`, person: p, ts: p.checked_in_at, action: "in" })
      if (p.checked_out_at)
        arr.push({
          id: `${p.id}-out`,
          person: p,
          ts: p.checked_out_at,
          action: "out",
        })
      return arr
    })
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

  if (events.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
        Nog geen scans vandaag.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <ul className="divide-y">
        {events.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                {e.person.first_name[0]}
                {e.person.last_name[0]}
              </div>
              <div>
                <div className="font-medium">
                  {e.person.first_name} {e.person.last_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {e.person.group.name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {e.action === "in" ? (
                <StatusBadge status="checked_in" />
              ) : (
                <StatusBadge status="checked_out" />
              )}
              <span className="font-mono text-xs text-muted-foreground">
                {formatTime(e.ts)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
