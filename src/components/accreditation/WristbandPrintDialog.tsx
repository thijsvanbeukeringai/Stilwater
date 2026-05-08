"use client"

import { useEffect, useState } from "react"
import { X, Printer, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { generateWristbandZpl, labelaryPreviewUrl } from "@/lib/zpl"
import { showToast } from "@/components/accreditation/Toast"
import type { Group, Project, Zone } from "@/types/accreditation"

type Phase = "ready" | "printing" | "done"

export function WristbandPrintDialog({
  open,
  person,
  group,
  zones,
  project,
  onClose,
  /** Optioneel: print direct zonder klik. Default true. */
  autoPrint = true,
}: {
  open: boolean
  person: {
    first_name: string
    last_name: string
    role?: string
    qr_token: string
  } | null
  group?: Group
  zones: Zone[]
  project: Project
  onClose: () => void
  autoPrint?: boolean
}) {
  const [phase, setPhase] = useState<Phase>("ready")

  useEffect(() => {
    if (!open) {
      setPhase("ready")
      return
    }
    if (!autoPrint) return
    // Schedule a small delay so the user sees the preview before "print" runs.
    const t = setTimeout(() => triggerPrint(), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoPrint])

  if (!open || !person) return null

  const zpl = generateWristbandZpl({
    person,
    group,
    project,
    zones,
    qr_token: person.qr_token,
  })
  const previewUrl = labelaryPreviewUrl(zpl)

  function triggerPrint() {
    setPhase("printing")
    // Simuleer netwerk-roundtrip naar Zebra Browser Print / lokale agent
    setTimeout(() => {
      setPhase("done")
      showToast(
        `Polsbandje voor ${person!.first_name} ${person!.last_name} verstuurd naar Zebra-printer`
      )
      // Auto-close na 1.5s zodat de centralist door kan
      setTimeout(() => onClose(), 1500)
    }, 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60" onClick={onClose} />
      <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b px-5 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Zebra polsbandje
            </p>
            <h2 className="text-base font-semibold tracking-tight">
              {person.first_name} {person.last_name}
            </h2>
            {(person.role || group?.name) && (
              <p className="text-xs text-muted-foreground">
                {[person.role, group?.name].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>

        <div className="space-y-3 p-5">
          {/* Preview */}
          <div className="overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="ZPL preview"
              className="w-full bg-white"
            />
            <div className="flex items-center justify-between gap-2 border-t bg-zinc-50 px-3 py-1.5 text-[10px] text-muted-foreground">
              <span>254 × 25 mm · 8 dpmm · eerste 20 mm leeg (sluiting)</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Open in nieuw tabblad
              </a>
            </div>
          </div>

          {/* Status banner */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-md border px-4 py-3 text-sm",
              phase === "printing" && "border-blue-300 bg-blue-50 text-blue-900",
              phase === "done" &&
                "border-emerald-300 bg-emerald-50 text-emerald-900",
              phase === "ready" && "border-zinc-200 bg-zinc-50 text-zinc-700"
            )}
          >
            {phase === "printing" && <Loader2 className="size-4 animate-spin" />}
            {phase === "done" && <Check className="size-4" />}
            {phase === "ready" && <Printer className="size-4" />}
            <span className="flex-1">
              {phase === "ready" && "Bandje gereed om te printen."}
              {phase === "printing" && "Versturen naar Zebra-printer…"}
              {phase === "done" &&
                "Bandje verstuurd. De printer drukt nu af."}
            </span>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t bg-zinc-50/50 px-5 py-3">
          {phase === "ready" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Annuleren
              </Button>
              <Button
                onClick={triggerPrint}
                className="bg-zinc-900 text-white hover:bg-zinc-800"
              >
                <Printer className="size-4" />
                Print bandje
              </Button>
            </>
          )}
          {phase === "printing" && (
            <Button disabled>
              <Loader2 className="size-4 animate-spin" />
              Bezig…
            </Button>
          )}
          {phase === "done" && (
            <Button variant="outline" onClick={onClose}>
              Sluiten
            </Button>
          )}
        </footer>
      </div>
    </div>
  )
}
