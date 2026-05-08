import type {
  Project,
  Group,
  Zone,
  ItemType,
  Person,
  Briefing,
  ApprovalLog,
  ScanLog,
} from "@/types/accreditation"

export const PROJECT_ID = "11111111-1111-1111-1111-111111111111"

export const PROJECT: Project = {
  id: PROJECT_ID,
  name: "Paaspop 2026",
  client: "Mojo Concerts",
  build_days: ["2026-04-15", "2026-04-16"],
  show_days: ["2026-04-17", "2026-04-18", "2026-04-19"],
  day_meals: {
    "2026-04-15": ["lunch", "dinner"],
    "2026-04-16": ["breakfast", "lunch", "dinner"],
    "2026-04-17": ["breakfast", "lunch", "dinner", "nightsnack"],
    "2026-04-18": ["breakfast", "lunch", "dinner", "nightsnack"],
    "2026-04-19": ["breakfast", "lunch", "dinner"],
  },
  day_items: {
    "2026-04-15": ["item-portofoon"],
    "2026-04-16": ["item-portofoon"],
    "2026-04-17": ["item-portofoon"],
    "2026-04-18": ["item-portofoon"],
    "2026-04-19": ["item-portofoon"],
  },
  wristband_strategy: "zebra_print",
}

export const GROUPS: Group[] = [
  {
    id: "g-1",
    project_id: PROJECT_ID,
    name: "Crew Productie",
    contact_name: "Sanne de Vries",
    contact_email: "sanne@productie.nl",
    type: "crew",
    invite_token: "inv_a1b2c3d4e5f6a7b8",
    item_limits: {
      "item-parking": { Productie: 4, Crew: 2 },
      "item-band-crew": 24,
      "item-portofoon": 6,
    },
    max_persons: 24,
    zone_ids: ["z-1", "z-2", "z-4"],
  },
  {
    id: "g-2",
    project_id: PROJECT_ID,
    name: "Headliner — Stromae",
    contact_name: "Marc Lambert",
    contact_email: "marc@stromae.tour",
    type: "artist",
    invite_token: "inv_z9y8x7w6v5u4t3s2",
    item_limits: {
      "item-parking": { Artist: 4 },
      "item-band-artist": 12,
      "item-inear": 6,
    },
    max_persons: 12,
    zone_ids: ["z-1", "z-2"],
  },
  {
    id: "g-3",
    project_id: PROJECT_ID,
    name: "Catering Vermaat",
    contact_name: "Erik Bos",
    contact_email: "erik@vermaat.nl",
    type: "supplier",
    invite_token: "inv_q1w2e3r4t5y6u7i8",
    item_limits: {
      "item-parking": { Crew: 4, Bezoeker: 4 },
      "item-band-supplier": 16,
    },
    max_persons: 16,
    zone_ids: ["z-3"],
  },
  {
    id: "g-4",
    project_id: PROJECT_ID,
    name: "Pers — VPRO",
    contact_name: "Linda van Dijk",
    contact_email: "linda@vpro.nl",
    type: "press",
    invite_token: "inv_m1n2b3v4c5x6z7l8",
    item_limits: {},
    max_persons: 6,
    zone_ids: ["z-5"],
  },
]

export const ZONES: Zone[] = [
  {
    id: "z-1",
    project_id: PROJECT_ID,
    name: "Backstage",
    color: "#7c3aed",
    capacity: 200,
    sort_order: 0,
    number: 1,
  },
  {
    id: "z-2",
    project_id: PROJECT_ID,
    name: "Stage",
    color: "#dc2626",
    capacity: 50,
    sort_order: 1,
    number: 2,
  },
  {
    id: "z-3",
    project_id: PROJECT_ID,
    name: "Catering",
    color: "#f59e0b",
    capacity: 300,
    sort_order: 2,
    number: 3,
  },
  {
    id: "z-4",
    project_id: PROJECT_ID,
    name: "Productiekantoor",
    color: "#0ea5e9",
    capacity: 30,
    sort_order: 3,
    number: 4,
  },
  {
    id: "z-5",
    project_id: PROJECT_ID,
    name: "Press Centre",
    color: "#10b981",
    capacity: 40,
    sort_order: 4,
    number: 5,
  },
]

export const ITEM_TYPES: ItemType[] = [
  {
    id: "item-band-crew",
    project_id: PROJECT_ID,
    name: "Polsband Crew",
    total_available: 200,
    variants: [],
    sort_order: 0,
    color: "#1f2937",
    category: "wristband",
    scope: "per_person",
  },
  {
    id: "item-band-artist",
    project_id: PROJECT_ID,
    name: "Polsband Artist",
    total_available: 80,
    variants: [],
    sort_order: 1,
    color: "#dc2626",
    category: "wristband",
    scope: "per_person",
  },
  {
    id: "item-band-supplier",
    project_id: PROJECT_ID,
    name: "Polsband Supplier",
    total_available: 80,
    variants: [],
    sort_order: 2,
    color: "#f59e0b",
    category: "wristband",
    scope: "per_person",
  },
  {
    id: "item-band-press",
    project_id: PROJECT_ID,
    name: "Polsband Press",
    total_available: 40,
    variants: [],
    sort_order: 3,
    color: "#10b981",
    category: "wristband",
    scope: "per_person",
  },
  {
    id: "item-parking",
    project_id: PROJECT_ID,
    name: "Parkeerkaart",
    total_available: 150,
    variants: ["Artist", "Productie", "Crew", "Bezoeker"],
    sort_order: 4,
    category: "parking",
    scope: "per_person",
  },
  {
    id: "item-portofoon",
    project_id: PROJECT_ID,
    name: "Portofoon",
    total_available: 40,
    variants: ["Kanaal 1", "Kanaal 2", "Kanaal 3"],
    sort_order: 5,
    category: "equipment",
    scope: "per_day",
  },
  {
    id: "item-headset",
    project_id: PROJECT_ID,
    name: "Headset",
    total_available: 30,
    variants: [],
    sort_order: 6,
    category: "equipment",
    scope: "per_day",
  },
  {
    id: "item-inear",
    project_id: PROJECT_ID,
    name: "In-ear oortje",
    total_available: 20,
    variants: [],
    sort_order: 7,
    category: "equipment",
    scope: "per_day",
  },
]

const allShowDays = PROJECT.show_days
const allDays = [...PROJECT.build_days, ...PROJECT.show_days]

export const PERSONS: Person[] = [
  {
    id: "p-1",
    project_id: PROJECT_ID,
    group_id: "g-1",
    first_name: "Mark",
    last_name: "Janssen",
    email: "mark@productie.nl",
    role: "Stage Manager",
    status: "approved",
    qr_token: "qr_aaaa1111bbbb2222",
    valid_days: allDays,
    approved_days: allDays,
    meal_selections: {
      "2026-04-17": ["lunch", "dinner"],
      "2026-04-18": ["breakfast", "lunch", "dinner"],
    },
    zone_ids: ["z-1", "z-2", "z-4"],
    items: [
      {
        id: "pi-1",
        person_id: "p-1",
        item_type_id: "item-band-crew",
        quantity: 1,
        issued: false,
      },
      {
        id: "pi-2",
        person_id: "p-1",
        item_type_id: "item-parking",
        quantity: 1,
        selected_variant: "Backstage",
        issued: false,
      },
    ],
  },
  {
    id: "p-2",
    project_id: PROJECT_ID,
    group_id: "g-1",
    first_name: "Lisa",
    last_name: "Bakker",
    email: "lisa@productie.nl",
    role: "Runner",
    status: "draft",
    qr_token: "qr_cccc3333dddd4444",
    valid_days: allShowDays,
    approved_days: [],
    meal_selections: { "2026-04-17": ["lunch"], "2026-04-18": ["lunch", "dinner"] },
    zone_ids: ["z-1", "z-3"],
    items: [
      {
        id: "pi-3",
        person_id: "p-2",
        item_type_id: "item-band-crew",
        quantity: 1,
        issued: false,
      },
    ],
  },
  {
    id: "p-3",
    project_id: PROJECT_ID,
    group_id: "g-2",
    first_name: "Paul",
    last_name: "van Acker",
    email: "paul@stromae.tour",
    role: "Tour Manager",
    status: "approved",
    qr_token: "qr_eeee5555ffff6666",
    checked_in_at: "2026-04-17T13:24:00.000Z",
    valid_days: ["2026-04-17"],
    approved_days: ["2026-04-17"],
    meal_selections: { "2026-04-17": ["lunch", "dinner", "nightsnack"] },
    zone_ids: ["z-1", "z-2"],
    items: [
      {
        id: "pi-4",
        person_id: "p-3",
        item_type_id: "item-band-artist",
        quantity: 1,
        issued: true,
        issued_at: "2026-04-17T13:24:00.000Z",
      },
    ],
  },
  {
    id: "p-4",
    project_id: PROJECT_ID,
    group_id: "g-2",
    first_name: "Stromae",
    last_name: "(Paul Van Haver)",
    email: "team@stromae.tour",
    role: "Artist",
    status: "approved",
    qr_token: "qr_gggg7777hhhh8888",
    valid_days: ["2026-04-17"],
    approved_days: ["2026-04-17"],
    meal_selections: { "2026-04-17": ["dinner"] },
    zone_ids: ["z-1", "z-2"],
    items: [
      {
        id: "pi-5",
        person_id: "p-4",
        item_type_id: "item-band-artist",
        quantity: 1,
        issued: false,
      },
    ],
  },
  {
    id: "p-5",
    project_id: PROJECT_ID,
    group_id: "g-3",
    first_name: "Erik",
    last_name: "Bos",
    email: "erik@vermaat.nl",
    role: "Catering Lead",
    status: "draft",
    qr_token: "qr_iiii9999jjjj0000",
    valid_days: allDays,
    approved_days: [],
    meal_selections: {},
    zone_ids: ["z-3"],
    items: [
      {
        id: "pi-6",
        person_id: "p-5",
        item_type_id: "item-band-supplier",
        quantity: 1,
        issued: false,
      },
    ],
  },
  {
    id: "p-6",
    project_id: PROJECT_ID,
    group_id: "g-3",
    first_name: "Aniek",
    last_name: "Mulder",
    email: "aniek@vermaat.nl",
    role: "Cook",
    status: "draft",
    qr_token: "qr_kkkk1111llll2222",
    valid_days: allDays,
    approved_days: [],
    meal_selections: {},
    zone_ids: ["z-3"],
    items: [
      {
        id: "pi-7",
        person_id: "p-6",
        item_type_id: "item-band-supplier",
        quantity: 1,
        issued: false,
      },
    ],
  },
  {
    id: "p-7",
    project_id: PROJECT_ID,
    group_id: "g-4",
    first_name: "Linda",
    last_name: "van Dijk",
    email: "linda@vpro.nl",
    role: "Journalist",
    status: "draft",
    qr_token: "qr_mmmm3333nnnn4444",
    valid_days: ["2026-04-18"],
    approved_days: [],
    meal_selections: {},
    zone_ids: ["z-5"],
    items: [
      {
        id: "pi-8",
        person_id: "p-7",
        item_type_id: "item-band-press",
        quantity: 1,
        issued: false,
      },
    ],
  },
  {
    id: "p-8",
    project_id: PROJECT_ID,
    group_id: "g-1",
    first_name: "Jeroen",
    last_name: "de Vries",
    email: "jeroen@productie.nl",
    role: "Lighting Technician",
    status: "approved",
    qr_token: "qr_oooo5555pppp6666",
    checked_in_at: "2026-04-15T09:12:00.000Z",
    checked_out_at: "2026-04-15T22:45:00.000Z",
    valid_days: allDays,
    approved_days: allDays,
    meal_selections: {},
    zone_ids: ["z-1", "z-2", "z-4"],
    items: [
      {
        id: "pi-9",
        person_id: "p-8",
        item_type_id: "item-band-crew",
        quantity: 1,
        issued: true,
        issued_at: "2026-04-15T09:12:00.000Z",
      },
      {
        id: "pi-10",
        person_id: "p-8",
        item_type_id: "item-portofoon",
        quantity: 1,
        selected_variant: "Kanaal 1",
        day: "2026-04-15",
        issued: true,
        issued_at: "2026-04-15T09:12:00.000Z",
      },
    ],
  },
]

export const BRIEFINGS: Briefing[] = [
  {
    id: "b-1",
    project_id: PROJECT_ID,
    title: "Algemene veiligheidsbriefing",
    content:
      "Volg te allen tijde de aanwijzingen van de productieleiding. Nooduitgangen en vluchtwegen zijn op het terreinplan aangegeven.",
    mandatory: true,
    created_at: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "b-2",
    project_id: PROJECT_ID,
    group_id: "g-2",
    title: "Briefing artiestenploeg",
    content: "Soundcheck schema en backstage routing. Stiptheid op call times.",
    mandatory: true,
    created_at: "2026-04-05T10:00:00.000Z",
  },
]

export const APPROVAL_LOGS: ApprovalLog[] = [
  {
    id: "al-1",
    person_id: "p-1",
    action: "approved",
    days: allDays,
    by_user_id: "u-admin",
    created_at: "2026-04-10T14:22:00.000Z",
  },
  {
    id: "al-2",
    person_id: "p-3",
    action: "approved",
    days: ["2026-04-17"],
    by_user_id: "u-admin",
    created_at: "2026-04-12T09:05:00.000Z",
  },
  {
    id: "al-3",
    person_id: "p-4",
    action: "approved",
    days: ["2026-04-17"],
    by_user_id: "u-admin",
    created_at: "2026-04-12T09:05:00.000Z",
  },
]

export const SCAN_LOGS: ScanLog[] = [
  {
    id: "s-1",
    person_id: "p-3",
    qr_token: "qr_eeee5555ffff6666",
    success: true,
    action: "check_in",
    scanned_at: "2026-04-17T13:24:00.000Z",
  },
  {
    id: "s-2",
    person_id: "p-8",
    qr_token: "qr_oooo5555pppp6666",
    success: true,
    action: "check_in",
    scanned_at: "2026-04-15T09:12:00.000Z",
  },
  {
    id: "s-3",
    person_id: "p-8",
    qr_token: "qr_oooo5555pppp6666",
    success: true,
    action: "check_out",
    scanned_at: "2026-04-15T22:45:00.000Z",
  },
]

// Helpers
export function getGroupById(id: string) {
  return GROUPS.find((g) => g.id === id)
}
export function getPersonByQrToken(token: string) {
  return PERSONS.find((p) => p.qr_token === token)
}
export function getPersonById(id: string) {
  return PERSONS.find((p) => p.id === id)
}
export function getGroupByInviteToken(token: string) {
  return GROUPS.find((g) => g.invite_token === token)
}
export function getZoneById(id: string) {
  return ZONES.find((z) => z.id === id)
}
export function getItemTypeById(id: string) {
  return ITEM_TYPES.find((it) => it.id === id)
}

export function dayLabel(date: string) {
  return new Date(date).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export function dayType(date: string): "build" | "show" | "teardown" {
  if (PROJECT.show_days.includes(date)) return "show"
  if (PROJECT.build_days.includes(date)) return "build"
  return "teardown"
}
