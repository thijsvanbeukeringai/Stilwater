"use client"

import { useMemo } from "react"
import {
  Download,
  Printer,
  Coffee,
  Car,
  Shield,
  UserX,
  ScanLine,
  Tag,
} from "lucide-react"
import { PROJECT, dayLabel } from "@/lib/mock/data"
import { Button } from "@/components/ui/button"
import {
  useGroups,
  useItemTypes,
  usePersons,
  useScanLogs,
  useZones,
} from "@/lib/store/accreditation-store"
import { showToast } from "@/components/accreditation/Toast"

type ExportKey =
  | "catering"
  | "parking"
  | "zones"
  | "noshow"
  | "scans"
  | "wristbands"

export function ReportsClient() {
  const persons = usePersons()
  const groups = useGroups()
  const zones = useZones()
  const itemTypes = useItemTypes()
  const scanLogs = useScanLogs()

  const totals = useMemo(() => {
    const approved = persons.filter((p) =>
      ["approved", "checked_in", "checked_out"].includes(p.status)
    ).length
    const checkedIn = persons.filter((p) => p.status === "checked_in").length
    const checkedOut = persons.filter((p) => p.status === "checked_out").length
    const noShow = persons.filter(
      (p) =>
        p.status === "approved" &&
        p.approved_days.length > 0 &&
        !p.checked_in_at
    ).length
    return { approved, checkedIn, checkedOut, noShow }
  }, [persons])

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows
      .map((r) =>
        r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")
      )
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    showToast(`${filename} gedownload`)
  }

  const buildCsv = (key: ExportKey) => {
    const groupName = (id: string) =>
      groups.find((g) => g.id === id)?.name ?? "—"

    switch (key) {
      case "catering": {
        const rows: string[][] = [
          ["Datum", "Bedrijf", "Naam", "Ontbijt", "Lunch", "Diner", "Nachtsnack"],
        ]
        persons.forEach((p) => {
          if (!["approved", "checked_in", "checked_out"].includes(p.status))
            return
          Object.entries(p.meal_selections).forEach(([day, meals]) => {
            const ms = meals as string[]
            rows.push([
              day,
              groupName(p.group_id),
              `${p.first_name} ${p.last_name}`,
              ms.includes("breakfast") ? "x" : "",
              ms.includes("lunch") ? "x" : "",
              ms.includes("dinner") ? "x" : "",
              ms.includes("nightsnack") ? "x" : "",
            ])
          })
        })
        downloadCsv(`catering-${PROJECT.name}.csv`, rows)
        break
      }
      case "parking": {
        const parking = itemTypes.filter((it) => it.category === "parking")
        const parkingIds = new Set(parking.map((p) => p.id))
        const rows: string[][] = [
          ["Bedrijf", "Naam", "Type", "Variant", "Aantal"],
        ]
        persons.forEach((p) => {
          p.items
            .filter((it) => parkingIds.has(it.item_type_id))
            .forEach((it) => {
              const t = parking.find((x) => x.id === it.item_type_id)
              rows.push([
                groupName(p.group_id),
                `${p.first_name} ${p.last_name}`,
                t?.name ?? "",
                it.selected_variant ?? "",
                String(it.quantity),
              ])
            })
        })
        downloadCsv(`parkeerkaarten-${PROJECT.name}.csv`, rows)
        break
      }
      case "zones": {
        const rows: string[][] = [
          ["Zone", "Bedrijf", "Naam", "Status"],
        ]
        zones.forEach((z) => {
          persons
            .filter((p) => p.zone_ids.includes(z.id))
            .forEach((p) => {
              rows.push([
                z.name,
                groupName(p.group_id),
                `${p.first_name} ${p.last_name}`,
                p.status,
              ])
            })
        })
        downloadCsv(`zones-${PROJECT.name}.csv`, rows)
        break
      }
      case "noshow": {
        const rows: string[][] = [
          ["Bedrijf", "Naam", "Goedgekeurde dagen", "Ingecheckt"],
        ]
        persons
          .filter(
            (p) =>
              p.status === "approved" &&
              p.approved_days.length > 0 &&
              !p.checked_in_at
          )
          .forEach((p) => {
            rows.push([
              groupName(p.group_id),
              `${p.first_name} ${p.last_name}`,
              p.approved_days.join("; "),
              "nee",
            ])
          })
        downloadCsv(`noshow-${PROJECT.name}.csv`, rows)
        break
      }
      case "scans": {
        const rows: string[][] = [
          ["Tijd", "Naam", "Bedrijf", "Actie", "Succes", "Bericht"],
        ]
        scanLogs.forEach((s) => {
          const p = persons.find((x) => x.id === s.person_id)
          rows.push([
            s.scanned_at,
            p ? `${p.first_name} ${p.last_name}` : "—",
            p ? groupName(p.group_id) : "—",
            s.action,
            s.success ? "ja" : "nee",
            s.message ?? "",
          ])
        })
        downloadCsv(`scans-${PROJECT.name}.csv`, rows)
        break
      }
      case "wristbands": {
        const wristbands = itemTypes.filter((it) => it.category === "wristband")
        const wbIds = new Set(wristbands.map((w) => w.id))
        const rows: string[][] = [
          ["Bedrijf", "Naam", "Polsband", "Uitgegeven", "Tijdstip"],
        ]
        persons.forEach((p) => {
          p.items
            .filter((it) => wbIds.has(it.item_type_id))
            .forEach((it) => {
              const t = wristbands.find((x) => x.id === it.item_type_id)
              rows.push([
                groupName(p.group_id),
                `${p.first_name} ${p.last_name}`,
                t?.name ?? "",
                it.issued ? "ja" : "nee",
                it.issued_at ?? "",
              ])
            })
        })
        downloadCsv(`polsbanden-${PROJECT.name}.csv`, rows)
        break
      }
    }
  }

  const EXPORTS: Array<{
    key: ExportKey
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    formats: ("CSV" | "PDF")[]
  }> = [
    {
      key: "catering",
      title: "Catering per dag",
      description:
        "Aantal maaltijden per dag, gegroepeerd per groep en maaltijdtype.",
      icon: Coffee,
      formats: ["CSV", "PDF"],
    },
    {
      key: "parking",
      title: "Parkeerkaarten",
      description: "Lijst met toegewezen parkeerkaarten per persoon en variant.",
      icon: Car,
      formats: ["CSV", "PDF"],
    },
    {
      key: "zones",
      title: "Accreditatie per zone",
      description: "Wie heeft toegang tot welke zone, geordend per zone.",
      icon: Shield,
      formats: ["CSV", "PDF"],
    },
    {
      key: "noshow",
      title: "No-show rapport",
      description: "Approved personen die niet zijn ingecheckt.",
      icon: UserX,
      formats: ["CSV"],
    },
    {
      key: "scans",
      title: "Scan log",
      description: "Volledige scan-historie inclusief mislukte pogingen.",
      icon: ScanLine,
      formats: ["CSV"],
    },
    {
      key: "wristbands",
      title: "Polsband uitgifte",
      description: "Welke wristbands zijn uitgegeven en wanneer.",
      icon: Tag,
      formats: ["CSV", "PDF"],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Reports</h2>
        <p className="text-sm text-muted-foreground">
          Centrale exports en print-views voor productie en logistiek. Cijfers
          actualiseren live.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Goedgekeurd" value={totals.approved} />
        <Stat label="Ingecheckt" value={totals.checkedIn} />
        <Stat label="Uitgecheckt" value={totals.checkedOut} />
        <Stat label="No-shows" value={totals.noShow} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {EXPORTS.map((ex) => {
          const Icon = ex.icon
          return (
            <article
              key={ex.key}
              className="flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold tracking-tight">{ex.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ex.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {ex.formats.map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={f === "CSV" ? "default" : "outline"}
                      onClick={() => {
                        if (f === "CSV") {
                          buildCsv(ex.key)
                        } else {
                          showToast(
                            "PDF-export volgt in een latere fase. CSV werkt al."
                          )
                        }
                      }}
                    >
                      {f === "CSV" ? (
                        <Download className="size-3.5" />
                      ) : (
                        <Printer className="size-3.5" />
                      )}
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">Showdagen-overzicht</h3>
        <p className="text-xs text-muted-foreground">
          Aantal goedgekeurde personen per showdag.
        </p>
        <ul className="mt-3 space-y-1.5">
          {PROJECT.show_days.map((d) => {
            const n = persons.filter((p) => p.approved_days.includes(d)).length
            const pct = totals.approved
              ? Math.round((n / totals.approved) * 100)
              : 0
            return (
              <li key={d} className="flex items-center gap-3">
                <span className="w-32 text-xs text-muted-foreground">
                  {dayLabel(d)}
                </span>
                <div className="flex-1 overflow-hidden rounded bg-zinc-100">
                  <div
                    className="h-2 bg-blue-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right tabular-nums text-xs">{n}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "warning"
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 ${
        tone === "warning" ? "border-amber-300 bg-amber-50" : ""
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}
