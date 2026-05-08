import { cn } from "@/lib/utils"

type DayState = "available" | "selected" | "approved" | "disabled"
type DayKind = "build" | "show" | "teardown"

const KIND_RING: Record<DayKind, string> = {
  build: "ring-amber-200",
  show: "ring-blue-200",
  teardown: "ring-zinc-200",
}

export function DayChip({
  date,
  kind = "show",
  state = "available",
  size = "md",
  onClick,
  className,
}: {
  date: string
  kind?: DayKind
  state?: DayState
  size?: "sm" | "md" | "lg"
  onClick?: () => void
  className?: string
}) {
  const d = new Date(date)
  const weekday = d.toLocaleDateString("nl-NL", { weekday: "short" })
  const dayMonth = d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })

  const stateClass = (() => {
    switch (state) {
      case "selected":
        return "bg-blue-100 text-blue-800 ring-blue-300"
      case "approved":
        return "bg-emerald-100 text-emerald-800 ring-emerald-300"
      case "disabled":
        return "bg-zinc-50 text-zinc-400 ring-zinc-200 cursor-not-allowed"
      default:
        return cn("bg-white text-zinc-700 hover:bg-zinc-50", KIND_RING[kind])
    }
  })()

  const sizeClass = {
    sm: "h-7 px-2 text-[11px]",
    md: "h-9 px-3 text-xs",
    lg: "h-11 px-4 text-sm",
  }[size]

  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={state === "disabled"}
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-md ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        sizeClass,
        stateClass,
        className
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-current/80">
        {weekday}
      </span>
      <span className="text-xs font-semibold leading-none">{dayMonth}</span>
    </Tag>
  )
}
