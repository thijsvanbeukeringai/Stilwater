export type Role =
  | "runner"
  | "planner"
  | "centralist"
  | "company_admin"
  | "super_admin"

export type PersonStatus =
  | "draft"
  | "approved"
  | "rejected"
  | "checked_in"
  | "checked_out"

export type GroupType =
  | "crew"
  | "artist"
  | "supplier"
  | "press"
  | "vip"
  | "other"

export type ItemCategory = "wristband" | "equipment" | "parking" | "other"

export type ItemScope = "per_person" | "per_day"

export type DayType = "build" | "show" | "teardown"

export type MealType = "breakfast" | "lunch" | "dinner" | "nightsnack"

export type ApprovalAction =
  | "approved"
  | "rejected"
  | "day_added"
  | "day_removed"
  | "token_rotated"

/**
 * Per-bedrijf limiet voor een item-type.
 * - `number`: één totaal-cap voor alle varianten (of voor items zonder varianten)
 * - `Record<variant, number>`: per-variant cap. Varianten met 0 of niet aanwezig
 *   zijn niet beschikbaar voor het bedrijf.
 */
export type ItemLimitValue = number | Record<string, number>

export interface Project {
  id: string
  name: string
  client?: string
  show_days: string[]
  build_days: string[]
  day_meals: Record<string, MealType[]>
  day_items: Record<string, string[]>
  default_meal_config?: Record<string, MealType[]>
  default_zone_setup?: unknown
  /**
   * Polsband-strategie voor het hele evenement:
   * - `preprinted`: fysiek bandje is al klaar (kleur + vaste opdruk).
   *   Bedrijf krijgt een type uit de pool toegewezen.
   * - `zebra_print`: bandje wordt per persoon op locatie geprint via Zebra
   *   printer met de toegestane zone-nummers + naam erop.
   */
  wristband_strategy?: "preprinted" | "zebra_print"
}

export interface Group {
  id: string
  project_id: string
  name: string
  contact_name?: string
  contact_email?: string
  type: GroupType
  invite_token: string
  invite_expires_at?: string
  item_limits: Record<string, ItemLimitValue>
  max_persons?: number
  meal_config?: Record<string, MealType[]>
  /**
   * Zones die elke crewlid van dit bedrijf standaard krijgt. Het bedrijf zelf
   * (portaal) kiest géén zones; admin stelt ze hier in op bedrijfsniveau.
   */
  zone_ids?: string[]
}

export interface Zone {
  id: string
  project_id: string
  name: string
  color: string
  capacity?: number
  sort_order: number
  /** Nummer dat op zebra-geprinte polsbandjes wordt afgedrukt. */
  number?: number
}

export interface ItemType {
  id: string
  project_id: string
  name: string
  total_available?: number
  variants: string[]
  sort_order: number
  color?: string
  category: ItemCategory
  scope: ItemScope
}

export interface PersonItem {
  id: string
  person_id: string
  item_type_id: string
  quantity: number
  selected_variant?: string
  day?: string
  issued: boolean
  issued_at?: string
}

export interface Person {
  id: string
  project_id: string
  group_id: string
  first_name: string
  last_name: string
  email?: string
  role?: string
  status: PersonStatus
  qr_token: string
  checked_in_at?: string
  checked_out_at?: string
  valid_days: string[]
  approved_days: string[]
  meal_selections: Record<string, MealType[]>
  /**
   * Aantal porties per maaltijd per dag — voor crew die meerdere porties
   * lunch/diner krijgen (lange dienst, koppels, etc.). Default = 1 per
   * meal die in `meal_selections[day]` staat.
   */
  meal_counts?: Record<string, Partial<Record<MealType, number>>>
  notes?: string
  zone_ids: string[]
  items: PersonItem[]
}

export interface ScanLog {
  id: string
  person_id: string
  qr_token: string
  success: boolean
  action: "check_in" | "check_out" | "lookup"
  message?: string
  scanned_at: string
}

/**
 * Eén uitgegeven maaltijd. Wordt aangemaakt zodra een crewlid scant bij
 * catering — voorkomt dat dezelfde maaltijd nogmaals geclaimd wordt.
 */
export interface MealRedemption {
  id: string
  person_id: string
  qr_token: string
  day: string
  meal: MealType
  redeemed_at: string
  by_scanner?: string
}

export interface ApprovalLog {
  id: string
  person_id: string
  action: ApprovalAction
  days?: string[]
  by_user_id: string
  reason?: string
  created_at: string
}

export interface Briefing {
  id: string
  project_id: string
  group_id?: string
  title: string
  content: string
  file_url?: string
  mandatory: boolean
  created_at: string
}

export interface BriefingAck {
  id: string
  person_id: string
  briefing_id: string
  acknowledged_at: string
}

export interface DailyStats {
  project_id: string
  day: string
  persons_count: number
  meals: Record<MealType, number>
  items: Record<string, number>
}
