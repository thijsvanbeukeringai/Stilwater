import { cn } from "@/lib/utils"

export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-zinc-300 bg-zinc-50 px-1.5 text-[10px] font-medium text-zinc-700 shadow-[0_1px_0_rgb(0_0_0_/_0.05)]",
        className
      )}
    >
      {children}
    </kbd>
  )
}
