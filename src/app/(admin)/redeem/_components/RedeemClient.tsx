"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  X,
  AlertTriangle,
  Clock,
  ScanLine,
  ChevronRight,
  RotateCcw,
  Coffee,
  UtensilsCrossed,
  Cookie,
  Moon,
} from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  accreditationActions,
  useMealRedemptions,
  usePersons,
  useProject,
} from "@/lib/store/accreditation-store"
import {
  type MealScanResult,
  countMealRedemptions,
  getMealAllowance,
  validateMealScan,
} from "@/lib/redemption"
import { dayLabel } from "@/lib/mock/data"
import type { MealType, Person } from "@/types/accreditation"

const MEALS: Array<{
  id: MealType
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: "breakfast", label: "Ontbijt", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: UtensilsCrossed },
  { id: "dinner", label: "Diner", icon: UtensilsCrossed },
  { id: "nightsnack", label: "Nachtsnack", icon: Cookie },
]

export function RedeemClient() {
  const project = useProject()
  const persons = usePersons()
  const redemptions = useMealRedemptions()

  const allDays = useMemo(
    () => [...project.build_days, ...project.show_days].sort(),
    [project]
  )

  // Default day: today if in range, else first show day
  const todayIso = new Date().toISOString().slice(0, 10)
  const defaultDay = allDays.includes(todayIso)
    ? todayIso
    : project.show_days[0] ?? allDays[0]

  const [day, setDay] = useState(defaultDay)
  const [meal, setMeal] = useState<MealType>("lunch")
  const [token, setToken] = useState("")
  const [result, setResult] = useState<MealScanResult | null>(null)
  const [resetTimer, setResetTimer] = useState<number | null>(null)

  // Counts for current (day, meal)
  const todayStats = useMemo(() => {
    const eligible = persons.filter(
      (p) =>
        p.approved_days.includes(day) &&
        getMealAllowance(p, day, meal) > 0
    )
    const totalAllowance = eligible.reduce(
      (s, p) => s + getMealAllowance(p, day, meal),
      0
    )
    const claimed = redemptions.filter(
      (r) => r.day === day && r.meal === meal
    ).length
    return { totalAllowance, claimed, eligibleCount: eligible.length }
  }, [persons, redemptions, day, meal])

  // Recent redemptions for current (day, meal)
  const recent = useMemo(
    () =>
      redemptions
        .filter((r) => r.day === day && r.meal === meal)
        .slice(0, 12)
        .map((r) => {
          const p = persons.find((x) => x.id === r.person_id)
          return { redemption: r, person: p }
        }),
    [redemptions, persons, day, meal]
  )

  const submit = (rawToken?: string) => {
    const t = (rawToken ?? token).trim()
    if (!t) return
    const res = validateMealScan({
      qrToken: t,
      day,
      meal,
      persons,
      redemptions,
    })
    if (res.kind === "ok") {
      accreditationActions.redeemMeal({
        personId: res.person.id,
        qrToken: res.person.qr_token,
        day,
        meal,
      })
    }
    setResult(res)
    setToken("")
    // Auto-reset overlay after 3 seconds
    if (resetTimer) window.clearTimeout(resetTimer)
    const id = window.setTimeout(() => setResult(null), 3000)
    setResetTimer(id)
  }

  useEffect(() => {
    return () => {
      if (resetTimer) window.clearTimeout(resetTimer)
    }
  }, [resetTimer])

  const undo = (id: string) => {
    accreditationActions.undoMealRedemption(id)
  }

  const sampleTokens = useMemo(
    () =>
      persons
        .filter(
          (p) =>
            p.approved_days.includes(day) && getMealAllowance(p, day, meal) > 0
        )
        .slice(0, 4),
    [persons, day, meal]
  )

  return (
    <div className="space-y-4">
      {/* Sticky context selector */}
      <div className="sticky top-0 z-20 -mx-4 -mt-6 border-b bg-zinc-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Maaltijd-uitgifte
            </h1>
            <p className="text-xs text-muted-foreground">
              Scan een polsbandje om een maaltijd af te boeken voor de
              geselecteerde dag en maaltijd.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white">
              {todayStats.claimed} / {todayStats.totalAllowance} uitgegeven
            </span>
            <span className="text-xs text-muted-foreground">
              ({todayStats.eligibleCount} crewleden)
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dag
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {allDays.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    day === d
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  {dayLabel(d)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Maaltijd
            </p>
            <div className="mt-1 grid grid-cols-4 gap-1">
              {MEALS.map((m) => {
                const Icon = m.icon
                const active = meal === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setMeal(m.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Result overlay */}
      <ResultPanel result={result} onClear={() => setResult(null)} />

      {/* Scanner area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
        <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <ScanLine className="mx-auto size-12 text-zinc-400" />
          <p className="mt-3 text-sm text-zinc-500">Camera weergave (mock)</p>
          <p className="mt-1 text-xs text-zinc-400">
            In productie: live videostream — token wordt automatisch ingelezen
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold">Handmatige invoer</h3>
            <p className="text-xs text-muted-foreground">
              Plak of typ een QR-token wanneer de camera niet werkt.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="mt-3 flex gap-2"
            >
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="qr_…"
                className="font-mono"
              />
              <Button type="submit">Boek af</Button>
            </form>
          </div>

          {sampleTokens.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold">Test tokens</h3>
              <p className="text-xs text-muted-foreground">
                Klik om een scan voor deze dag/maaltijd te simuleren.
              </p>
              <ul className="mt-2 space-y-1">
                {sampleTokens.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => submit(p.qr_token)}
                      className="flex w-full items-center justify-between rounded border bg-zinc-50 px-2 py-1.5 text-left text-xs transition-colors hover:bg-zinc-100"
                    >
                      <span className="font-medium">
                        {p.first_name} {p.last_name}
                      </span>
                      <span className="text-muted-foreground">
                        <RemainingPill
                          person={p}
                          day={day}
                          meal={meal}
                        />
                        <ChevronRight className="ml-1 inline size-3" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recent redemptions */}
      {recent.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <h3 className="text-sm font-semibold">
              Recent uitgegeven · {dayLabel(day)} ·{" "}
              {MEALS.find((m) => m.id === meal)?.label}
            </h3>
            <span className="text-xs text-muted-foreground">
              {redemptions.filter((r) => r.day === day && r.meal === meal).length}{" "}
              totaal
            </span>
          </div>
          <ul className="divide-y">
            {recent.map(({ redemption: r, person: p }) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-emerald-600" />
                  <div>
                    <div className="font-medium">
                      {p ? `${p.first_name} ${p.last_name}` : "Onbekend"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(r.redeemed_at)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => undo(r.id)}
                  className="text-xs"
                >
                  <RotateCcw className="size-3.5" />
                  Undo
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function RemainingPill({
  person,
  day,
  meal,
}: {
  person: Person
  day: string
  meal: MealType
}) {
  const redemptions = useMealRedemptions()
  const allowance = getMealAllowance(person, day, meal)
  const used = countMealRedemptions(redemptions, person.id, day, meal)
  const remaining = allowance - used
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 font-mono",
        remaining === 0
          ? "bg-red-100 text-red-700"
          : remaining < allowance
          ? "bg-amber-100 text-amber-800"
          : "bg-emerald-100 text-emerald-700"
      )}
    >
      {remaining}/{allowance}
    </span>
  )
}

function ResultPanel({
  result,
  onClear,
}: {
  result: MealScanResult | null
  onClear: () => void
}) {
  if (!result) return null

  const tone = (() => {
    switch (result.kind) {
      case "ok":
        return {
          ring: "ring-emerald-300",
          bg: "bg-emerald-50",
          text: "text-emerald-900",
          icon: <Check className="size-10 text-emerald-600" />,
        }
      case "already_redeemed":
        return {
          ring: "ring-amber-300",
          bg: "bg-amber-50",
          text: "text-amber-900",
          icon: <AlertTriangle className="size-10 text-amber-600" />,
        }
      case "not_eligible":
      case "wrong_day":
        return {
          ring: "ring-orange-300",
          bg: "bg-orange-50",
          text: "text-orange-900",
          icon: <AlertTriangle className="size-10 text-orange-600" />,
        }
      default:
        return {
          ring: "ring-red-300",
          bg: "bg-red-50",
          text: "text-red-900",
          icon: <X className="size-10 text-red-600" />,
        }
    }
  })()

  const personName =
    "person" in result
      ? `${result.person.first_name} ${result.person.last_name}`
      : "Onbekend"

  return (
    <div
      className={cn(
        "rounded-2xl border-2 px-6 py-5 ring-2",
        tone.ring,
        tone.bg
      )}
      onClick={onClear}
    >
      <div className="flex items-start gap-4">
        {tone.icon}
        <div className="flex-1">
          <h2 className={cn("text-2xl font-bold", tone.text)}>
            {result.kind === "ok" && `${personName} — geboekt`}
            {result.kind === "already_redeemed" && `${personName} — al ontvangen`}
            {result.kind === "not_eligible" &&
              `${personName} — geen recht op deze maaltijd`}
            {result.kind === "wrong_day" && `${personName} — verkeerde dag`}
            {result.kind === "not_approved" &&
              `${personName} — niet goedgekeurd`}
            {result.kind === "unknown_token" && "Onbekende QR-code"}
          </h2>
          {"message" in result && result.message && (
            <p className={cn("mt-1 text-sm", tone.text)}>{result.message}</p>
          )}
          {result.kind === "ok" && (
            <p className="mt-2 text-sm">
              <strong className="tabular-nums">{result.remaining}</strong> van{" "}
              <strong className="tabular-nums">{result.allowance}</strong>{" "}
              porties resterend voor deze persoon vandaag.
            </p>
          )}
          {result.kind === "already_redeemed" && (
            <p className="mt-2 text-sm">
              Reeds <strong>{result.used}</strong> van{" "}
              <strong>{result.allowance}</strong> opgehaald
              {result.lastAt && ` · laatste om ${formatTime(result.lastAt)}`}.
            </p>
          )}
          <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Klik om te wissen
          </p>
        </div>
      </div>
    </div>
  )
}
