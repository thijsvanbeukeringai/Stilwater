"use client"

import { useMemo } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { dayLabel, dayType, PROJECT } from "@/lib/mock/data"
import { StatusBadge } from "@/components/accreditation/StatusBadge"
import type { Group, ItemType } from "@/types/accreditation"
import type { EnrichedCrew } from "./CompanyCrewView"
import { getItemTotalLimit } from "@/lib/limits"

export function CompanyCrewGrid({
  crew,
  allDays,
  itemTypes,
  company,
  onSelect,
}: {
  crew: EnrichedCrew[]
  allDays: string[]
  itemTypes: ItemType[]
  company: Group
  onSelect: (p: EnrichedCrew) => void
}) {
  // Only show items the company is allowed to request
  const allowedItems = useMemo(
    () =>
      Object.keys(company.item_limits)
        .map((id) => itemTypes.find((it) => it.id === id))
        .filter((it): it is ItemType => !!it),
    [company.item_limits, itemTypes]
  )

  const wristbands = allowedItems.filter((it) => it.category === "wristband")
  const parking = allowedItems.filter((it) => it.category === "parking")
  const equipment = allowedItems.filter((it) => it.category === "equipment")
  const other = allowedItems.filter((it) => it.category === "other")

  const columnTotals = useMemo(() => {
    const dayTotals: Record<string, number> = {}
    allDays.forEach((d) => {
      dayTotals[d] = crew.filter((p) => p.valid_days.includes(d)).length
    })
    const itemTotals: Record<string, number> = {}
    allowedItems.forEach((it) => {
      itemTotals[it.id] = crew.reduce(
        (sum, p) =>
          sum +
          p.items
            .filter((pi) => pi.item_type_id === it.id)
            .reduce((s, pi) => s + pi.quantity, 0),
        0
      )
    })
    return { dayTotals, itemTotals }
  }, [crew, allDays, allowedItems])

  const buildDays = allDays.filter((d) => PROJECT.build_days.includes(d))
  const showDays = allDays.filter((d) => PROJECT.show_days.includes(d))

  return (
    <div className="overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-xs">
        <thead className="sticky top-0 z-10 bg-zinc-50">
          <tr>
            <th
              className="sticky left-0 z-20 border-b border-r bg-zinc-50 p-2 text-left font-medium text-muted-foreground"
              style={{ minWidth: 200 }}
            >
              Crewlid
            </th>
            <th className="border-b bg-zinc-50 p-2 text-left font-medium text-muted-foreground">
              Status
            </th>
            {/* Day columns: build first, then show */}
            {buildDays.length > 0 && (
              <th
                colSpan={buildDays.length}
                className="border-b border-l bg-amber-50 p-1 text-center font-semibold uppercase tracking-wider text-amber-800"
              >
                Opbouw
              </th>
            )}
            {showDays.length > 0 && (
              <th
                colSpan={showDays.length}
                className="border-b border-l bg-blue-50 p-1 text-center font-semibold uppercase tracking-wider text-blue-800"
              >
                Show
              </th>
            )}
            {wristbands.length > 0 && (
              <th
                colSpan={wristbands.length}
                className="border-b border-l bg-rose-50 p-1 text-center font-semibold uppercase tracking-wider text-rose-800"
              >
                Polsband
              </th>
            )}
            {parking.length > 0 && (
              <th
                colSpan={parking.length}
                className="border-b border-l bg-sky-50 p-1 text-center font-semibold uppercase tracking-wider text-sky-800"
              >
                Parkeren
              </th>
            )}
            {equipment.length > 0 && (
              <th
                colSpan={equipment.length}
                className="border-b border-l bg-emerald-50 p-1 text-center font-semibold uppercase tracking-wider text-emerald-800"
              >
                Equipment
              </th>
            )}
            {other.length > 0 && (
              <th
                colSpan={other.length}
                className="border-b border-l bg-zinc-100 p-1 text-center font-semibold uppercase tracking-wider text-zinc-800"
              >
                Overig
              </th>
            )}
          </tr>
          {/* Sub-header row with concrete day/item names */}
          <tr>
            <th
              className="sticky left-0 z-20 border-b border-r bg-zinc-50 p-1"
              style={{ minWidth: 200 }}
            />
            <th className="border-b bg-zinc-50 p-1" />
            {[...buildDays, ...showDays].map((d, i, arr) => (
              <th
                key={d}
                className={cn(
                  "border-b bg-zinc-50 px-2 py-1 text-center font-medium text-muted-foreground",
                  (i === 0 ||
                    (PROJECT.show_days.includes(d) &&
                      !PROJECT.show_days.includes(arr[i - 1]))) &&
                    "border-l"
                )}
                style={{ minWidth: 60 }}
              >
                <div className="flex flex-col">
                  <span>
                    {new Date(d).toLocaleDateString("nl-NL", {
                      weekday: "short",
                    })}
                  </span>
                  <span className="text-[10px] tabular-nums">
                    {new Date(d).getDate()}
                  </span>
                </div>
              </th>
            ))}
            {[...wristbands, ...parking, ...equipment, ...other].map((it, i) => (
              <th
                key={it.id}
                className={cn(
                  "border-b bg-zinc-50 px-2 py-1 text-center font-medium text-muted-foreground",
                  i === 0 && "border-l"
                )}
                style={{ minWidth: 80 }}
              >
                <div className="flex flex-col items-center">
                  {it.color && (
                    <span
                      className="size-2 rounded-sm ring-1 ring-zinc-300"
                      style={{ backgroundColor: it.color }}
                    />
                  )}
                  <span className="truncate">{it.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {crew.map((p) => (
            <tr
              key={p.id}
              className="cursor-pointer hover:bg-zinc-50"
              onClick={() => onSelect(p)}
            >
              <td
                className="sticky left-0 z-10 border-b border-r bg-white p-2 group-hover:bg-zinc-50"
                style={{ minWidth: 200 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-700">
                    {p.first_name[0]}
                    {p.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {p.first_name} {p.last_name}
                    </div>
                    {p.role && (
                      <div className="truncate text-[10px] text-muted-foreground">
                        {p.role}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="border-b bg-white p-2">
                <StatusBadge status={p.status} />
              </td>
              {[...buildDays, ...showDays].map((d, i, arr) => {
                const has = p.valid_days.includes(d)
                const approved = p.approved_days.includes(d)
                return (
                  <td
                    key={d}
                    className={cn(
                      "border-b bg-white p-1 text-center",
                      (i === 0 ||
                        (PROJECT.show_days.includes(d) &&
                          !PROJECT.show_days.includes(arr[i - 1]))) &&
                        "border-l",
                      has && approved && "bg-emerald-50",
                      has && !approved && "bg-blue-50"
                    )}
                  >
                    {has ? (
                      <Check
                        className={cn(
                          "mx-auto size-4",
                          approved ? "text-emerald-700" : "text-blue-700"
                        )}
                      />
                    ) : (
                      <span className="text-zinc-300">·</span>
                    )}
                  </td>
                )
              })}
              {[...wristbands, ...parking, ...equipment, ...other].map((it, i) => {
                const items = p.items.filter((pi) => pi.item_type_id === it.id)
                const total = items.reduce((s, pi) => s + pi.quantity, 0)
                const variants = [
                  ...new Set(
                    items.map((pi) => pi.selected_variant).filter(Boolean)
                  ),
                ]
                return (
                  <td
                    key={it.id}
                    className={cn(
                      "border-b bg-white p-1 text-center",
                      i === 0 && "border-l"
                    )}
                  >
                    {total > 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="font-semibold tabular-nums">
                          {total}
                        </span>
                        {variants.length > 0 && (
                          <span className="text-[9px] text-muted-foreground">
                            {variants.join(", ")}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-300">·</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-zinc-50">
          <tr>
            <td
              className="sticky left-0 z-10 border-t border-r bg-zinc-50 p-2 text-xs font-semibold"
              style={{ minWidth: 200 }}
            >
              Totalen
            </td>
            <td className="border-t bg-zinc-50 p-2 text-xs text-muted-foreground">
              {crew.length} crew
            </td>
            {[...buildDays, ...showDays].map((d, i, arr) => (
              <td
                key={d}
                className={cn(
                  "border-t bg-zinc-50 p-1 text-center text-xs font-semibold tabular-nums",
                  (i === 0 ||
                    (PROJECT.show_days.includes(d) &&
                      !PROJECT.show_days.includes(arr[i - 1]))) &&
                    "border-l"
                )}
              >
                {columnTotals.dayTotals[d]}
              </td>
            ))}
            {[...wristbands, ...parking, ...equipment, ...other].map((it, i) => {
              const used = columnTotals.itemTotals[it.id] ?? 0
              const limit = getItemTotalLimit(company.item_limits, it.id) ?? 0
              const over = limit > 0 && used > limit
              return (
                <td
                  key={it.id}
                  className={cn(
                    "border-t bg-zinc-50 p-1 text-center text-xs font-semibold tabular-nums",
                    i === 0 && "border-l",
                    over && "text-red-700"
                  )}
                >
                  {used}
                  {limit > 0 && (
                    <span className="font-normal text-muted-foreground">
                      /{limit}
                    </span>
                  )}
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
