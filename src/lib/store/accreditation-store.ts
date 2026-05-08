"use client"

/**
 * Centrale client-side store voor de accreditatie-prototype.
 *
 * Tijdelijke vervanger voor Supabase: alle pagina's lezen via hooks zodat
 * mutaties (approve, check-in, edit) direct propageren naar elke surface die
 * met dezelfde data werkt.
 *
 * Bij integratie met Supabase wordt deze module vervangen door echte queries
 * en server actions; de hook-interface kan grotendeels intact blijven.
 */

import { useSyncExternalStore } from "react"
import {
  PROJECT as SEED_PROJECT,
  PERSONS as SEED_PERSONS,
  GROUPS as SEED_GROUPS,
  ZONES as SEED_ZONES,
  ITEM_TYPES as SEED_ITEM_TYPES,
  BRIEFINGS as SEED_BRIEFINGS,
  APPROVAL_LOGS as SEED_APPROVAL_LOGS,
  SCAN_LOGS as SEED_SCAN_LOGS,
} from "@/lib/mock/data"
import type {
  Person,
  Group,
  Project,
  Zone,
  ItemType,
  Briefing,
  ApprovalLog,
  ScanLog,
  MealRedemption,
  MealType,
  PersonStatus,
} from "@/types/accreditation"

type State = {
  project: Project
  persons: Person[]
  groups: Group[]
  zones: Zone[]
  itemTypes: ItemType[]
  briefings: Briefing[]
  approvalLogs: ApprovalLog[]
  scanLogs: ScanLog[]
  mealRedemptions: MealRedemption[]
}

const STORAGE_KEY = "accreditatie-store-v6"

function createSeedState(): State {
  return {
    project: structuredClone(SEED_PROJECT),
    persons: structuredClone(SEED_PERSONS),
    groups: structuredClone(SEED_GROUPS),
    zones: structuredClone(SEED_ZONES),
    itemTypes: structuredClone(SEED_ITEM_TYPES),
    briefings: structuredClone(SEED_BRIEFINGS),
    approvalLogs: structuredClone(SEED_APPROVAL_LOGS),
    scanLogs: structuredClone(SEED_SCAN_LOGS),
    mealRedemptions: [],
  }
}

// Always start from seed on module load. Real values are pulled from
// localStorage by hydrateFromStorage() on the client after mount — this keeps
// SSR/hydration consistent (server has no storage).
let state: State = createSeedState()

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function persist() {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // quota / privacy mode / etc — ignore for the prototype
  }
}

let hydrated = false
let storageListenerAttached = false

/**
 * Call once from a client-only effect on app boot. Loads persisted state from
 * localStorage and sets up cross-tab sync via the storage event.
 */
export function hydrateFromStorage() {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>
      // Defensive merge with seed shape so missing collections don't crash.
      const seed = createSeedState()
      state = {
        project: parsed.project ?? seed.project,
        persons: parsed.persons ?? seed.persons,
        groups: parsed.groups ?? seed.groups,
        zones: parsed.zones ?? seed.zones,
        itemTypes: parsed.itemTypes ?? seed.itemTypes,
        briefings: parsed.briefings ?? seed.briefings,
        approvalLogs: parsed.approvalLogs ?? seed.approvalLogs,
        scanLogs: parsed.scanLogs ?? seed.scanLogs,
        mealRedemptions: parsed.mealRedemptions ?? seed.mealRedemptions,
      }
      emit()
    }
  } catch {
    // bad JSON or schema mismatch — fall back to seed state already in memory
  }

  if (!storageListenerAttached) {
    storageListenerAttached = true
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue) as State
        state = parsed
        emit()
      } catch {
        // ignore
      }
    })
  }
}

/**
 * useStore: subscribe to a slice of the store.
 * Returns referentially-stable result for primitive selectors; for object
 * selectors keep them simple (return the same array reference).
 */
export function useAccreditation<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state)
  )
}

// ===== Read hooks =====

export const useProject = () => useAccreditation((s) => s.project)
export const usePersons = () => useAccreditation((s) => s.persons)
export const useGroups = () => useAccreditation((s) => s.groups)
export const useZones = () => useAccreditation((s) => s.zones)
export const useItemTypes = () => useAccreditation((s) => s.itemTypes)
export const useBriefings = () => useAccreditation((s) => s.briefings)
export const useApprovalLogs = () => useAccreditation((s) => s.approvalLogs)
export const useScanLogs = () => useAccreditation((s) => s.scanLogs)
export const useMealRedemptions = () =>
  useAccreditation((s) => s.mealRedemptions)

export const usePerson = (id: string | undefined) =>
  useAccreditation((s) => (id ? s.persons.find((p) => p.id === id) : undefined))

export const useGroup = (id: string | undefined) =>
  useAccreditation((s) => (id ? s.groups.find((g) => g.id === id) : undefined))

// ===== Mutations =====

const now = () => new Date().toISOString()
const nid = () => Math.random().toString(36).slice(2)

function update(mutator: (s: State) => State) {
  state = mutator(state)
  emit()
  persist()
}

function logApproval(personId: string, action: ApprovalLog["action"], days?: string[], reason?: string) {
  return {
    id: nid(),
    person_id: personId,
    action,
    days,
    by_user_id: "u-admin",
    reason,
    created_at: now(),
  }
}

export const accreditationActions = {
  // ----- Project -----
  updateProject(patch: Partial<Project>) {
    update((s) => ({ ...s, project: { ...s.project, ...patch } }))
  },

  // ----- Persons -----
  upsertPerson(person: Person) {
    update((s) => {
      const exists = s.persons.some((p) => p.id === person.id)
      return {
        ...s,
        persons: exists
          ? s.persons.map((p) => (p.id === person.id ? person : p))
          : [...s.persons, person],
      }
    })
  },

  deletePerson(id: string) {
    update((s) => ({
      ...s,
      persons: s.persons.filter((p) => p.id !== id),
    }))
  },

  setPersonStatus(id: string, status: PersonStatus) {
    update((s) => ({
      ...s,
      persons: s.persons.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    }))
  },

  // ----- Approval -----
  approvePerson(id: string, days?: string[]) {
    update((s) => {
      const person = s.persons.find((p) => p.id === id)
      if (!person) return s
      const approvedDays = days ?? person.valid_days
      return {
        ...s,
        persons: s.persons.map((p) =>
          p.id === id
            ? {
                ...p,
                status: "approved" as PersonStatus,
                approved_days: approvedDays,
              }
            : p
        ),
        approvalLogs: [
          logApproval(id, "approved", approvedDays),
          ...s.approvalLogs,
        ],
      }
    })
  },

  rejectPerson(id: string, reason?: string) {
    update((s) => ({
      ...s,
      persons: s.persons.map((p) =>
        p.id === id
          ? { ...p, status: "rejected" as PersonStatus, approved_days: [] }
          : p
      ),
      approvalLogs: [logApproval(id, "rejected", undefined, reason), ...s.approvalLogs],
    }))
  },

  bulkApprove(ids: string[], days?: string[]) {
    update((s) => {
      const newLogs: ApprovalLog[] = []
      const persons = s.persons.map((p) => {
        if (!ids.includes(p.id)) return p
        const approvedDays = days ?? p.valid_days
        newLogs.push(logApproval(p.id, "approved", approvedDays))
        return {
          ...p,
          status: "approved" as PersonStatus,
          approved_days: approvedDays,
        }
      })
      return { ...s, persons, approvalLogs: [...newLogs, ...s.approvalLogs] }
    })
  },

  // ----- Check-in / out -----
  checkInPerson(id: string) {
    update((s) => ({
      ...s,
      persons: s.persons.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "checked_in" as PersonStatus,
              checked_in_at: now(),
            }
          : p
      ),
      scanLogs: [
        {
          id: nid(),
          person_id: id,
          qr_token: s.persons.find((p) => p.id === id)?.qr_token ?? "",
          success: true,
          action: "check_in" as const,
          scanned_at: now(),
        },
        ...s.scanLogs,
      ],
    }))
  },

  undoCheckIn(id: string) {
    update((s) => ({
      ...s,
      persons: s.persons.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "approved" as PersonStatus,
              checked_in_at: undefined,
            }
          : p
      ),
    }))
  },

  checkOutPerson(id: string) {
    update((s) => ({
      ...s,
      persons: s.persons.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "checked_out" as PersonStatus,
              checked_out_at: now(),
            }
          : p
      ),
      scanLogs: [
        {
          id: nid(),
          person_id: id,
          qr_token: s.persons.find((p) => p.id === id)?.qr_token ?? "",
          success: true,
          action: "check_out" as const,
          scanned_at: now(),
        },
        ...s.scanLogs,
      ],
    }))
  },

  markItemIssued(personItemId: string) {
    update((s) => ({
      ...s,
      persons: s.persons.map((p) => ({
        ...p,
        items: p.items.map((it) =>
          it.id === personItemId ? { ...it, issued: true, issued_at: now() } : it
        ),
      })),
    }))
  },

  // ----- Groups -----
  upsertGroup(group: Group) {
    update((s) => {
      const exists = s.groups.some((g) => g.id === group.id)
      return {
        ...s,
        groups: exists
          ? s.groups.map((g) => (g.id === group.id ? group : g))
          : [...s.groups, group],
      }
    })
  },

  deleteGroup(id: string) {
    update((s) => ({
      ...s,
      groups: s.groups.filter((g) => g.id !== id),
      persons: s.persons.filter((p) => p.group_id !== id),
    }))
  },

  // ----- Zones -----
  upsertZone(zone: Zone) {
    update((s) => {
      const exists = s.zones.some((z) => z.id === zone.id)
      return {
        ...s,
        zones: exists
          ? s.zones.map((z) => (z.id === zone.id ? zone : z))
          : [...s.zones, zone],
      }
    })
  },

  deleteZone(id: string) {
    update((s) => ({
      ...s,
      zones: s.zones.filter((z) => z.id !== id),
      persons: s.persons.map((p) => ({
        ...p,
        zone_ids: p.zone_ids.filter((zid) => zid !== id),
      })),
    }))
  },

  reorderZones(orderedIds: string[]) {
    update((s) => ({
      ...s,
      zones: [...s.zones]
        .sort(
          (a, b) =>
            (orderedIds.indexOf(a.id) === -1
              ? 999
              : orderedIds.indexOf(a.id)) -
            (orderedIds.indexOf(b.id) === -1
              ? 999
              : orderedIds.indexOf(b.id))
        )
        .map((z, i) => ({ ...z, sort_order: i })),
    }))
  },

  // ----- Item types -----
  upsertItemType(item: ItemType) {
    update((s) => {
      const exists = s.itemTypes.some((it) => it.id === item.id)
      return {
        ...s,
        itemTypes: exists
          ? s.itemTypes.map((it) => (it.id === item.id ? item : it))
          : [...s.itemTypes, item],
      }
    })
  },

  deleteItemType(id: string) {
    update((s) => ({
      ...s,
      itemTypes: s.itemTypes.filter((it) => it.id !== id),
      persons: s.persons.map((p) => ({
        ...p,
        items: p.items.filter((pi) => pi.item_type_id !== id),
      })),
    }))
  },

  // ----- Briefings -----
  upsertBriefing(briefing: Briefing) {
    update((s) => {
      const exists = s.briefings.some((b) => b.id === briefing.id)
      return {
        ...s,
        briefings: exists
          ? s.briefings.map((b) => (b.id === briefing.id ? briefing : b))
          : [...s.briefings, briefing],
      }
    })
  },

  deleteBriefing(id: string) {
    update((s) => ({
      ...s,
      briefings: s.briefings.filter((b) => b.id !== id),
    }))
  },

  // ----- Token rotation -----
  regenerateQrToken(personId: string) {
    update((s) => ({
      ...s,
      persons: s.persons.map((p) =>
        p.id === personId
          ? {
              ...p,
              qr_token:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID().replace(/-/g, "").slice(0, 32)
                  : `${nid()}${nid()}`.slice(0, 32),
            }
          : p
      ),
      approvalLogs: [
        logApproval(personId, "token_rotated"),
        ...s.approvalLogs,
      ],
    }))
  },

  regenerateInviteToken(groupId: string) {
    update((s) => ({
      ...s,
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              invite_token: `inv_${
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID().replace(/-/g, "").slice(0, 28)
                  : `${nid()}${nid()}`.slice(0, 28)
              }`,
            }
          : g
      ),
    }))
  },

  // ----- Meal redemptions -----
  redeemMeal(opts: {
    personId: string
    qrToken: string
    day: string
    meal: MealType
    byScanner?: string
  }) {
    update((s) => ({
      ...s,
      mealRedemptions: [
        {
          id: nid(),
          person_id: opts.personId,
          qr_token: opts.qrToken,
          day: opts.day,
          meal: opts.meal,
          redeemed_at: now(),
          by_scanner: opts.byScanner,
        },
        ...s.mealRedemptions,
      ],
    }))
  },

  undoMealRedemption(redemptionId: string) {
    update((s) => ({
      ...s,
      mealRedemptions: s.mealRedemptions.filter((r) => r.id !== redemptionId),
    }))
  },

  // ----- Reset (debug helper) -----
  reset() {
    state = createSeedState()
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
    emit()
  },
}
