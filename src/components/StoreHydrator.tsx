"use client"

import { useEffect } from "react"
import { hydrateFromStorage } from "@/lib/store/accreditation-store"

/**
 * Mount once near the root of the client tree to load persisted store state
 * from localStorage and wire up cross-tab sync. Renders nothing.
 */
export function StoreHydrator() {
  useEffect(() => {
    hydrateFromStorage()
  }, [])
  return null
}
