import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, locale = "nl-NL") {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export function formatDateTime(date: string | Date, locale = "nl-NL") {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTime(date: string | Date, locale = "nl-NL") {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * WCAG luminance calculation for hex color (#RRGGBB).
 * Returns text color ('#000' or '#fff') with highest contrast ratio.
 */
export function getReadableTextColor(hex: string): "#000000" | "#ffffff" {
  const cleaned = hex.replace("#", "")
  if (cleaned.length !== 6) return "#000000"
  const r = parseInt(cleaned.slice(0, 2), 16) / 255
  const g = parseInt(cleaned.slice(2, 4), 16) / 255
  const b = parseInt(cleaned.slice(4, 6), 16) / 255
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  const contrastWhite = 1.05 / (L + 0.05)
  const contrastBlack = (L + 0.05) / 0.05
  return contrastWhite >= contrastBlack ? "#ffffff" : "#000000"
}
