import { cn } from "@/lib/utils"
import type { PersonStatus } from "@/types/accreditation"

const STATUS_CONFIG: Record<
  PersonStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Aangevraagd",
    className: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  },
  approved: {
    label: "Goedgekeurd",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  rejected: {
    label: "Afgewezen",
    className: "bg-red-100 text-red-800 ring-red-200",
  },
  checked_in: {
    label: "Ingecheckt",
    className: "bg-blue-100 text-blue-800 ring-blue-200",
  },
  checked_out: {
    label: "Uitgecheckt",
    className:
      "bg-zinc-50 text-zinc-500 ring-zinc-200 line-through decoration-1",
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: PersonStatus
  className?: string
}) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        cfg.className,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {cfg.label}
    </span>
  )
}
