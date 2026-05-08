import Link from "next/link"
import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  delta?: string
  href?: string
  variant?: "default" | "highlight"
  className?: string
}

export function StatCard({
  label,
  value,
  delta,
  href,
  variant = "default",
  className,
}: StatCardProps) {
  const cls = cn(
    "block rounded-lg border bg-card p-4 shadow-sm transition-colors",
    href && "hover:border-zinc-300 hover:shadow-md",
    variant === "highlight" && "border-amber-300 bg-amber-50",
    className
  )

  const inner = (
    <>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </div>
        {delta ? (
          <div className="text-xs text-muted-foreground">{delta}</div>
        ) : null}
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    )
  }
  return <div className={cls}>{inner}</div>
}
