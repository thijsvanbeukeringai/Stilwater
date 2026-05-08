"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import QRCode from "qrcode"
import { Clock, AlertCircle, ShieldX, Code, Copy, X, ExternalLink } from "lucide-react"
import {
  useGroups,
  useItemTypes,
  usePersons,
  useProject,
  useZones,
} from "@/lib/store/accreditation-store"
import { dayLabel } from "@/lib/mock/data"
import { ZoneBadge } from "@/components/accreditation/ZoneBadge"
import { GroupTypeBadge } from "@/components/accreditation/RoleBadge"
import { Button } from "@/components/ui/button"
import { PrintButton } from "./PrintButton"
import { generateWristbandZpl, labelaryPreviewUrl } from "@/lib/zpl"
import { showToast } from "@/components/accreditation/Toast"
import type { MealType } from "@/types/accreditation"

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Ontbijt",
  lunch: "Lunch",
  dinner: "Diner",
  nightsnack: "Nachtsnack",
}

export function TicketClient({ qrToken }: { qrToken: string }) {
  const persons = usePersons()
  const groups = useGroups()
  const zones = useZones()
  const project = useProject()
  const itemTypes = useItemTypes()
  const [qrUrl, setQrUrl] = useState<string>("")
  const [showZpl, setShowZpl] = useState(false)

  const person = useMemo(
    () => persons.find((p) => p.qr_token === qrToken),
    [persons, qrToken]
  )

  useEffect(() => {
    if (!person) {
      setQrUrl("")
      return
    }
    let mounted = true
    QRCode.toDataURL(person.qr_token, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (mounted) setQrUrl(url)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [person])

  if (!person) {
    return <CenteredMessage icon={<AlertCircle className="size-10 text-zinc-400" />} title="Ticket niet gevonden" body="Deze QR-code is onbekend. Vraag de organisator om een nieuw ticket." />
  }

  const group = groups.find((g) => g.id === person.group_id)
  const personZones = zones.filter((z) => person.zone_ids.includes(z.id))
  const personItems = person.items
    .map((it) => ({
      ...it,
      type: itemTypes.find((t) => t.id === it.item_type_id),
    }))
    .filter((x) => x.type)

  if (person.status === "rejected") {
    return (
      <CenteredMessage
        icon={<ShieldX className="size-10 text-red-500" />}
        title="Aanvraag afgewezen"
        body="Deze accreditatieaanvraag is afgewezen door de organisator. Neem contact op voor meer informatie."
      />
    )
  }

  if (person.status === "draft") {
    return (
      <CenteredMessage
        icon={<Clock className="size-10 text-amber-500" />}
        title="Wacht op goedkeuring"
        body={
          <>
            <p>
              <strong>
                {person.first_name} {person.last_name}
              </strong>{" "}
              is aangevraagd maar nog niet goedgekeurd door de organisator. Het
              ticket wordt zichtbaar zodra de aanvraag is goedgekeurd.
            </p>
            <div className="mt-3 rounded-md border bg-amber-50 px-3 py-2 text-left text-xs text-amber-900">
              <p className="font-semibold">Aangevraagd:</p>
              <p>
                {person.valid_days.length} dag
                {person.valid_days.length === 1 ? "" : "en"} ·{" "}
                {Object.values(person.meal_selections).reduce(
                  (acc, ms) => acc + (ms as string[]).length,
                  0
                )}{" "}
                maaltijden ·{" "}
                {person.items.length} item
                {person.items.length === 1 ? "" : "s"}
              </p>
            </div>
          </>
        }
      />
    )
  }

  // Approved or further (checked_in / checked_out) — render full ticket
  const approvedDayLabels = person.approved_days
    .slice()
    .sort()
    .map((d) => ({ d, label: dayLabel(d) }))

  const meals = Object.entries(person.meal_selections)
    .filter(
      ([day, ms]) =>
        person.approved_days.includes(day) && (ms as string[]).length > 0
    )
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="min-h-screen bg-zinc-200 py-10 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-md flex-col gap-3 px-4 print:max-w-none print:px-0">
        <div className="no-print flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
          <div className="flex items-center gap-2">
            {project.wristband_strategy === "zebra_print" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowZpl(true)}
              >
                <Code className="size-3.5" />
                Bekijk ZPL
              </Button>
            )}
            <PrintButton />
          </div>
        </div>

        {/* Zebra-print polsband preview */}
        {project.wristband_strategy === "zebra_print" && (
          <ZebraWristbandPreview
            person={{
              first_name: person.first_name,
              last_name: person.last_name,
              role: person.role,
            }}
            groupName={group?.name}
            zones={personZones}
            project={project}
          />
        )}

        <article className="print-ticket relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-zinc-300 print:rounded-none print:shadow-none print:ring-0">
          <div className="bg-zinc-900 px-6 py-3 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Accreditatie
                </p>
                <h1 className="font-semibold tracking-tight">{project.name}</h1>
              </div>
              {group && (
                <GroupTypeBadge
                  type={group.type}
                  className="bg-white/10 text-white"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Naam
              </p>
              <p className="text-xl font-bold leading-tight">
                {person.first_name} {person.last_name}
              </p>
              {person.role && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {person.role}
                </p>
              )}
              {group && (
                <p className="mt-2 text-xs text-zinc-500">{group.name}</p>
              )}
            </div>
            <div className="flex flex-col items-center">
              {qrUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrUrl}
                  alt={`QR ${person.qr_token}`}
                  className="size-28 rounded ring-1 ring-zinc-200"
                />
              ) : (
                <div className="size-28 rounded bg-zinc-100 ring-1 ring-zinc-200" />
              )}
              <code className="mt-1 font-mono text-[9px] text-zinc-400">
                {person.qr_token.slice(0, 12)}…
              </code>
            </div>
          </div>

          <div className="space-y-3 border-t border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-4">
            {/* Approved days */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Geldig op {approvedDayLabels.length} dag
                {approvedDayLabels.length === 1 ? "" : "en"}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {approvedDayLabels.map(({ d, label }) => (
                  <span
                    key={d}
                    className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200"
                  >
                    ✓ {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Zones */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Toegang ({personZones.length} zone
                {personZones.length === 1 ? "" : "s"})
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {personZones.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Geen zones toegekend
                  </span>
                ) : (
                  personZones.map((z) => (
                    <span
                      key={z.id}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: z.color,
                        color: "#fff",
                      }}
                    >
                      {z.number !== undefined && (
                        <span className="rounded bg-black/20 px-1 font-bold tabular-nums">
                          {z.number}
                        </span>
                      )}
                      {z.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Items */}
            {personItems.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Items
                </p>
                <ul className="mt-1 space-y-0.5">
                  {personItems.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        {it.type?.color && (
                          <span
                            className="size-2.5 rounded-sm ring-1 ring-zinc-300"
                            style={{ backgroundColor: it.type.color }}
                          />
                        )}
                        {it.type?.name}
                        {it.selected_variant && (
                          <span className="text-muted-foreground">
                            · {it.selected_variant}
                          </span>
                        )}
                        {it.day && (
                          <span className="text-muted-foreground">
                            · {dayLabel(it.day)}
                          </span>
                        )}
                      </span>
                      <span className="font-mono">{it.quantity}×</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Meals */}
            {meals.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Maaltijden
                </p>
                <ul className="mt-1 space-y-0.5">
                  {meals.map(([day, ms]) => (
                    <li
                      key={day}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>{dayLabel(day)}</span>
                      <span className="text-muted-foreground">
                        {(ms as MealType[])
                          .map((m) => MEAL_LABEL[m])
                          .join(" · ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 px-6 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Niet overdraagbaar · ID nodig bij inname
          </div>
        </article>
      </div>

      {showZpl && project.wristband_strategy === "zebra_print" && (
        <ZplDialog
          person={person}
          group={group}
          zones={personZones}
          project={project}
          onClose={() => setShowZpl(false)}
        />
      )}
    </div>
  )
}

function ZplDialog({
  person,
  group,
  zones,
  project,
  onClose,
}: {
  person: { first_name: string; last_name: string; role?: string; qr_token: string }
  group?: { name: string }
  zones: { name: string; number?: number; color: string }[]
  project: { name: string }
  onClose: () => void
}) {
  const zpl = generateWristbandZpl({
    person,
    group,
    project,
    zones,
    qr_token: person.qr_token,
  })
  const previewUrl = labelaryPreviewUrl(zpl)

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b px-5 py-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              ZPL voor {person.first_name} {person.last_name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Stuur dit naar de Zebra-printer om het polsbandje te printen.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          <div className="overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="ZPL preview"
              className="w-full bg-white"
            />
            <p className="border-t bg-zinc-50 px-3 py-1.5 text-[10px] text-muted-foreground">
              Render via labelary.com — vergt internetverbinding.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 font-mono text-[11px] text-zinc-100">
            {zpl}
          </pre>
        </div>
        <footer className="flex justify-end gap-2 border-t bg-zinc-50/50 px-5 py-3">
          <Button asChild variant="outline" size="sm">
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              Open preview
            </a>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(zpl)
              showToast("ZPL gekopieerd")
            }}
          >
            <Copy className="size-3.5" />
            Kopieer ZPL
          </Button>
        </footer>
      </div>
    </div>
  )
}

function CenteredMessage({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="max-w-sm rounded-xl border bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-zinc-50">
          {icon}
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">{body}</div>
        <Link
          href="/"
          className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          ← Home
        </Link>
      </div>
    </div>
  )
}

function ZebraWristbandPreview({
  person,
  groupName,
  zones,
  project,
}: {
  person: { first_name: string; last_name: string; role?: string }
  groupName?: string
  zones: { id: string; name: string; color: string; number?: number }[]
  project: { name: string }
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-zinc-300">
      <div className="border-b bg-zinc-100/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
        Polsbandje (Zebra-print preview)
      </div>
      {/* Wristband strip — wide and short, like an actual band */}
      <div className="flex items-center gap-3 bg-zinc-900 px-4 py-3 text-white">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-400">
            {project.name}
          </p>
          <p className="truncate text-base font-bold leading-tight">
            {person.first_name} {person.last_name}
          </p>
          {(person.role || groupName) && (
            <p className="truncate text-[10px] text-zinc-300">
              {[person.role, groupName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {zones.map((z) => (
            <div
              key={z.id}
              className="flex size-8 items-center justify-center rounded-md text-sm font-bold text-white ring-2 ring-white/20"
              style={{ backgroundColor: z.color }}
              title={z.name}
            >
              {z.number ?? "?"}
            </div>
          ))}
          {zones.length === 0 && (
            <span className="text-xs text-zinc-400">geen zones</span>
          )}
        </div>
      </div>
    </div>
  )
}
