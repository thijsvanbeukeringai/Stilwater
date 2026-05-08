import type { ItemLimitValue } from "@/types/accreditation"

export type ItemLimits = Record<string, ItemLimitValue>

/** True if the company is allowed to request this item at all. */
export function isItemAllowed(limits: ItemLimits, itemId: string): boolean {
  const v = limits[itemId]
  if (v === undefined) return false
  if (typeof v === "number") return v > 0
  return Object.values(v).some((n) => n > 0)
}

/** True if this item is configured per-variant (not as a single total). */
export function isPerVariant(limits: ItemLimits, itemId: string): boolean {
  return typeof limits[itemId] === "object" && limits[itemId] !== null
}

/** Total cap across all variants, or undefined if not configured. */
export function getItemTotalLimit(
  limits: ItemLimits,
  itemId: string
): number | undefined {
  const v = limits[itemId]
  if (v === undefined) return undefined
  if (typeof v === "number") return v
  return Object.values(v).reduce((a, b) => a + b, 0)
}

/**
 * Returns the cap for a specific variant.
 * - If the item is not configured per-variant, falls back to the total cap.
 * - If the item is configured per-variant and `variant` is missing, returns 0.
 */
export function getVariantLimit(
  limits: ItemLimits,
  itemId: string,
  variant: string | undefined
): number | undefined {
  const v = limits[itemId]
  if (v === undefined) return undefined
  if (typeof v === "number") return v
  if (variant === undefined) return 0
  return v[variant] ?? 0
}

/** Filter the full variant list down to the ones the company may request. */
export function getAllowedVariants(
  limits: ItemLimits,
  itemId: string,
  allVariants: string[]
): string[] {
  const v = limits[itemId]
  if (v === undefined) return []
  if (typeof v === "number") return allVariants
  return allVariants.filter((name) => (v[name] ?? 0) > 0)
}
