"use client"

import { useEffect, useState } from "react"
import { Plus, ShieldAlert, FileText, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  accreditationActions,
  useBriefings,
  useGroups,
  usePersons,
} from "@/lib/store/accreditation-store"
import { showToast } from "@/components/accreditation/Toast"
import { PROJECT_ID } from "@/lib/mock/data"
import type { Briefing } from "@/types/accreditation"

export function BriefingsClient() {
  const briefings = useBriefings()
  const groups = useGroups()
  const persons = usePersons()
  const [editing, setEditing] = useState<Briefing | null>(null)
  const [creating, setCreating] = useState(false)

  const remove = (b: Briefing) => {
    if (!confirm(`Briefing "${b.title}" verwijderen?`)) return
    accreditationActions.deleteBriefing(b.id)
    showToast(`Briefing "${b.title}" verwijderd`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Briefings</h2>
          <p className="text-sm text-muted-foreground">
            Veiligheidsinformatie en verplichte instructies per project of groep.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Briefing toevoegen
        </Button>
      </div>

      {briefings.length === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Nog geen briefings.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {briefings.map((b) => {
            const group = b.group_id
              ? groups.find((g) => g.id === b.group_id)
              : null
            const audience = group
              ? persons.filter((p) => p.group_id === group.id).length
              : persons.length
            return (
              <article
                key={b.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 border-b p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                      {b.mandatory ? (
                        <ShieldAlert className="size-5" />
                      ) : (
                        <FileText className="size-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold tracking-tight">{b.title}</h3>
                        {b.mandatory && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                            Verplicht
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {group ? `Voor: ${group.name}` : "Project-breed"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditing(b)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => remove(b)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="px-4 py-3 text-sm text-zinc-700">{b.content}</div>
                <div className="border-t bg-zinc-50/50 px-4 py-2 text-xs text-muted-foreground">
                  Doelgroep: {audience} {audience === 1 ? "persoon" : "personen"}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <BriefingFormDialog
        open={creating || editing !== null}
        briefing={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function BriefingFormDialog({
  open,
  briefing,
  onClose,
}: {
  open: boolean
  briefing: Briefing | null
  onClose: () => void
}) {
  const groups = useGroups()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [groupId, setGroupId] = useState<string>("")
  const [mandatory, setMandatory] = useState(false)

  useEffect(() => {
    if (!open) return
    if (briefing) {
      setTitle(briefing.title)
      setContent(briefing.content)
      setGroupId(briefing.group_id ?? "")
      setMandatory(briefing.mandatory)
    } else {
      setTitle("")
      setContent("")
      setGroupId("")
      setMandatory(false)
    }
  }, [open, briefing])

  if (!open) return null

  const submit = () => {
    if (!title.trim()) return
    const next: Briefing = {
      id: briefing?.id ?? Math.random().toString(36).slice(2),
      project_id: briefing?.project_id ?? PROJECT_ID,
      group_id: groupId || undefined,
      title: title.trim(),
      content,
      mandatory,
      created_at: briefing?.created_at ?? new Date().toISOString(),
    }
    accreditationActions.upsertBriefing(next)
    showToast(briefing ? "Briefing bijgewerkt" : "Briefing aangemaakt")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-semibold">
            {briefing ? "Briefing bewerken" : "Nieuwe briefing"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>
        <div className="space-y-3 p-5">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Titel
            </Label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Inhoud (markdown)
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Doelgroep
            </Label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Project-breed</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={mandatory}
              onCheckedChange={(v) => setMandatory(!!v)}
            />
            <span className="text-sm">Verplicht (vereist ack van crew)</span>
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t bg-zinc-50/50 px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button
            className="bg-zinc-900 text-white hover:bg-zinc-800"
            onClick={submit}
          >
            {briefing ? "Opslaan" : "Aanmaken"}
          </Button>
        </footer>
      </div>
    </div>
  )
}
