"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGroups, usePersons } from "@/lib/store/accreditation-store"
import { CompaniesTable, type CompanyRow } from "./CompaniesTable"
import { CompanyFormDialog } from "./CompanyFormDialog"

export function CompaniesPageClient({ projectId }: { projectId: string }) {
  const groups = useGroups()
  const persons = usePersons()
  const [creating, setCreating] = useState(false)

  const rows = useMemo<CompanyRow[]>(
    () =>
      groups.map((g) => {
        const crew = persons.filter((p) => p.group_id === g.id)
        return {
          id: g.id,
          name: g.name,
          type: g.type,
          contact_name: g.contact_name,
          contact_email: g.contact_email,
          max_persons: g.max_persons,
          total: crew.length,
          pending: crew.filter((p) => p.status === "draft").length,
          approved: crew.filter((p) =>
            ["approved", "checked_in", "checked_out"].includes(p.status)
          ).length,
          checked_in: crew.filter((p) => p.status === "checked_in").length,
          invite_token: g.invite_token,
        }
      }),
    [groups, persons]
  )

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.companies += 1
          acc.crew += r.total
          acc.pending += r.pending
          acc.approved += r.approved
          return acc
        },
        { companies: 0, crew: 0, pending: 0, approved: 0 }
      ),
    [rows]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
            Stap 1
          </span>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Bedrijven</h1>
          <p className="text-sm text-muted-foreground">
            <strong>{totals.companies}</strong> bedrijven ·{" "}
            <strong>{totals.crew}</strong> crew ·{" "}
            <span className={totals.pending > 0 ? "text-amber-700" : ""}>
              {totals.pending} pending
            </span>{" "}
            ·{" "}
            <span className="text-emerald-700">{totals.approved} goedgekeurd</span>
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Bedrijf aanmaken
        </Button>
      </div>

      <CompaniesTable rows={rows} projectId={projectId} />

      <CompanyFormDialog
        open={creating}
        company={null}
        onClose={() => setCreating(false)}
      />
    </div>
  )
}
