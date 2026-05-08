import { PROJECT, dayLabel, dayType, ITEM_TYPES, PERSONS } from "@/lib/mock/data"
import { DayChip } from "@/components/accreditation/DayChip"
import type { MealType } from "@/types/accreditation"

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Ontbijt",
  lunch: "Lunch",
  dinner: "Diner",
  nightsnack: "Nachtsnack",
}

const KIND_TONE = {
  build: "bg-amber-50 text-amber-700 border-amber-200",
  show: "bg-blue-50 text-blue-700 border-blue-200",
  teardown: "bg-zinc-50 text-zinc-700 border-zinc-200",
} as const

export default function DaysPage() {
  const allDays = [...PROJECT.build_days, ...PROJECT.show_days].sort()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Project dagen</h2>
        <p className="text-sm text-muted-foreground">
          Opbouw-, show- en afbouwdagen met maaltijden en items per dag.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allDays.map((d) => {
          const kind = dayType(d)
          const meals = (PROJECT.day_meals[d] ?? []) as MealType[]
          const items = (PROJECT.day_items[d] ?? []).map(
            (id) => ITEM_TYPES.find((x) => x.id === id)?.name
          )
          const personsCount = PERSONS.filter((p) =>
            p.approved_days.includes(d)
          ).length
          return (
            <article
              key={d}
              className={`rounded-xl border p-4 shadow-sm ${KIND_TONE[kind]}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <DayChip date={d} kind={kind} state="approved" size="lg" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                  {kind}
                </span>
              </div>

              <div className="mt-3 text-sm">
                <strong className="tabular-nums">{personsCount}</strong>{" "}
                <span className="opacity-80">personen goedgekeurd</span>
              </div>

              {meals.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                    Maaltijden
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {meals.map((m) => (
                      <span
                        key={m}
                        className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-medium"
                      >
                        {MEAL_LABEL[m]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                    Items
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {items.map((n) => (
                      <span
                        key={n}
                        className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-medium"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
