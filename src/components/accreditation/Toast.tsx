"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

let counter = 0
type Toast = { id: number; tone: "success" | "info" | "error"; text: string }
type Listener = (t: Toast) => void
const listeners = new Set<Listener>()

export function showToast(text: string, tone: Toast["tone"] = "success") {
  const t: Toast = { id: ++counter, tone, text }
  listeners.forEach((l) => l(t))
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    const fn: Listener = (t) => {
      setItems((arr) => [...arr, t])
      setTimeout(
        () => setItems((arr) => arr.filter((x) => x.id !== t.id)),
        3000
      )
    }
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])

  if (items.length === 0) return null
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto rounded-md border bg-white px-4 py-2 text-sm shadow-lg ring-1",
            t.tone === "success" && "ring-emerald-200",
            t.tone === "info" && "ring-blue-200",
            t.tone === "error" && "ring-red-200 text-red-800"
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
