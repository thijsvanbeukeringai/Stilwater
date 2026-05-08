import { cn } from "@/lib/utils"
import type { GroupType } from "@/types/accreditation"

const TYPE_COLOR: Record<GroupType, string> = {
  crew: "bg-zinc-100 text-zinc-700",
  artist: "bg-rose-100 text-rose-800",
  supplier: "bg-amber-100 text-amber-800",
  press: "bg-emerald-100 text-emerald-800",
  vip: "bg-purple-100 text-purple-800",
  other: "bg-zinc-100 text-zinc-600",
}

const TYPE_LABEL: Record<GroupType, string> = {
  crew: "Crew",
  artist: "Artist",
  supplier: "Supplier",
  press: "Press",
  vip: "VIP",
  other: "Overig",
}

export function GroupTypeBadge({
  type,
  className,
}: {
  type: GroupType
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        TYPE_COLOR[type],
        className
      )}
    >
      {TYPE_LABEL[type]}
    </span>
  )
}
