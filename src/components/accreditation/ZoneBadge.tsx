import { cn, getReadableTextColor } from "@/lib/utils"

export function ZoneBadge({
  name,
  color,
  className,
}: {
  name: string
  color: string
  className?: string
}) {
  const fg = getReadableTextColor(color)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{ backgroundColor: color, color: fg }}
    >
      {name}
    </span>
  )
}
