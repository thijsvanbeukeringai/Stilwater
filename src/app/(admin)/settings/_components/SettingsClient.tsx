"use client"

import { useMemo, useState } from "react"
import { Printer, Award, Copy, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  accreditationActions,
  useGroups,
  usePersons,
  useProject,
  useZones,
} from "@/lib/store/accreditation-store"
import { showToast } from "@/components/accreditation/Toast"
import { generateWristbandZpl, labelaryPreviewUrl } from "@/lib/zpl"

export function SettingsClient() {
  const project = useProject()
  const strategy = project.wristband_strategy ?? "preprinted"

  const setStrategy = (next: "preprinted" | "zebra_print") => {
    if (next === strategy) return
    accreditationActions.updateProject({ wristband_strategy: next })
    showToast(
      next === "zebra_print"
        ? "Polsbandjes worden nu via Zebra geprint"
        : "Voorgedrukte polsbandjes ingesteld"
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Project-instellingen
        </h1>
        <p className="text-sm text-muted-foreground">
          Eigenschappen die voor het hele evenement gelden.
        </p>
      </div>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold tracking-tight">Project</h2>
          <p className="text-xs text-muted-foreground">
            Naam en planning van het evenement.
          </p>
        </div>
        <dl className="divide-y text-sm">
          <Row label="Naam" value={project.name} />
          {project.client && <Row label="Klant" value={project.client} />}
          <Row
            label="Showdagen"
            value={`${project.show_days.length} (${project.show_days[0]} → ${project.show_days[project.show_days.length - 1]})`}
          />
          <Row
            label="Opbouwdagen"
            value={`${project.build_days.length}`}
          />
        </dl>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold tracking-tight">
            Polsband-strategie
          </h2>
          <p className="text-xs text-muted-foreground">
            Bepaalt hoe crew hun polsbandje krijgen voor dit evenement.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <StrategyCard
            active={strategy === "preprinted"}
            onClick={() => setStrategy("preprinted")}
            icon={Award}
            title="Voorgedrukt"
            description="Het bandje is fysiek al klaar — kleur en opdruk staan vast. Bedrijven krijgen een type uit de pool toegewezen (bijv. Polsband Crew). Per bedrijf instelbaar via Limieten."
          />
          <StrategyCard
            active={strategy === "zebra_print"}
            onClick={() => setStrategy("zebra_print")}
            icon={Printer}
            title="Zebra-print"
            description="Bandje wordt op locatie geprint via Zebra-printer met persoonsnaam + zone-nummers. Geen pool nodig — elke crewlid krijgt een eigen bandje met de zone-nummers waar ze mogen komen."
          />
        </div>
      </section>

      {strategy === "zebra_print" && (
        <>
          <section className="rounded-xl border bg-card shadow-sm">
            <div className="border-b p-4">
              <h2 className="text-base font-semibold tracking-tight">
                Zone-nummers
              </h2>
              <p className="text-xs text-muted-foreground">
                Deze nummers worden op het Zebra-bandje afgedrukt zodat security
                op een blik kan zien waar iemand mag komen.
              </p>
            </div>
            <ZoneNumbersGrid />
          </section>

          <ZplPreviewSection />
        </>
      )}
    </div>
  )
}

function ZplPreviewSection() {
  const project = useProject()
  const persons = usePersons()
  const groups = useGroups()
  const zones = useZones()

  // Pak een approved persoon als sample, anders een dummy.
  const samplePerson = useMemo(() => {
    const real = persons.find((p) =>
      ["approved", "checked_in"].includes(p.status)
    )
    if (real) {
      const group = groups.find((g) => g.id === real.group_id)
      const personZones = zones.filter((z) => real.zone_ids.includes(z.id))
      return { person: real, group, zones: personZones }
    }
    return {
      person: {
        first_name: "Voorbeeld",
        last_name: "Crewlid",
        role: "Stage Manager",
        qr_token: "qr_voorbeeld_dummy_xxxxxxxxxxxxxx",
      },
      group: undefined,
      zones: zones.slice(0, 3),
    }
  }, [persons, groups, zones])

  const zpl = useMemo(
    () =>
      generateWristbandZpl({
        person: samplePerson.person,
        group: samplePerson.group,
        project,
        zones: samplePerson.zones,
        qr_token:
          "qr_token" in samplePerson.person
            ? samplePerson.person.qr_token
            : "",
      }),
    [samplePerson, project]
  )

  const previewUrl = labelaryPreviewUrl(zpl)

  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            ZPL voorbeeld
          </h2>
          <p className="text-xs text-muted-foreground">
            Sample ZPL-code (Zebra Programming Language) voor een polsbandje van{" "}
            <strong>
              {samplePerson.person.first_name} {samplePerson.person.last_name}
            </strong>
            . Layout: 254 × 25 mm (standaard Zebra wristband), 8 dpmm.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(zpl)
              showToast("ZPL gekopieerd")
            }}
          >
            <Copy className="size-3.5" />
            Kopieer
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              Live preview
            </a>
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3 overflow-hidden rounded-md border bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="ZPL preview via Labelary"
            className="h-auto w-full bg-white"
          />
          <p className="border-t bg-zinc-50 px-3 py-1.5 text-[10px] text-muted-foreground">
            Render via labelary.com — vergt internetverbinding. Lokaal printen
            gaat direct naar de Zebra via dezelfde ZPL.
          </p>
        </div>
        <pre className="overflow-x-auto rounded-md border bg-zinc-900 p-3 font-mono text-[11px] text-zinc-100">
          {zpl}
        </pre>
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function StrategyCard({
  active,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-4 text-left transition-all",
        active
          ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold tracking-tight">{title}</h3>
            {active && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Actief
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  )
}

function ZoneNumbersGrid() {
  const zones = useZones()
  return (
    <ul className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
      {zones.map((z) => (
        <li
          key={z.id}
          className="flex items-center gap-3 rounded-md border bg-zinc-50/50 px-3 py-2"
        >
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-base font-bold text-white"
            style={{ backgroundColor: z.color }}
          >
            {z.number ?? "—"}
          </span>
          <span className="truncate text-sm font-medium">{z.name}</span>
        </li>
      ))}
    </ul>
  )
}
