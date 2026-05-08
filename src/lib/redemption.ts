import type { MealRedemption, MealType, Person } from "@/types/accreditation"

/**
 * Hoeveel porties van `meal` mag deze persoon op `day` ophalen?
 * Default = 1 als de meal eligible is, anders 0. Override via meal_counts.
 */
export function getMealAllowance(
  person: Person,
  day: string,
  meal: MealType
): number {
  const eligible = (person.meal_selections[day] ?? []).includes(meal)
  if (!eligible) return 0
  const override = person.meal_counts?.[day]?.[meal]
  return typeof override === "number" && override > 0 ? override : 1
}

/** Hoeveel keer is `meal` op `day` al geclaimd door deze persoon? */
export function countMealRedemptions(
  redemptions: MealRedemption[],
  personId: string,
  day: string,
  meal: MealType
): number {
  return redemptions.filter(
    (r) => r.person_id === personId && r.day === day && r.meal === meal
  ).length
}

export type MealScanResult =
  | {
      kind: "ok"
      person: Person
      remaining: number
      allowance: number
    }
  | { kind: "unknown_token"; message: string }
  | { kind: "not_approved"; person: Person; message: string }
  | { kind: "wrong_day"; person: Person; message: string }
  | {
      kind: "not_eligible"
      person: Person
      meal: MealType
      message: string
    }
  | {
      kind: "already_redeemed"
      person: Person
      allowance: number
      used: number
      lastAt?: string
      message: string
    }

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "ontbijt",
  lunch: "lunch",
  dinner: "diner",
  nightsnack: "nachtsnack",
}

export function validateMealScan(opts: {
  qrToken: string
  day: string
  meal: MealType
  persons: Person[]
  redemptions: MealRedemption[]
}): MealScanResult {
  const { qrToken, day, meal, persons, redemptions } = opts
  const person = persons.find((p) => p.qr_token === qrToken.trim())
  if (!person) {
    return { kind: "unknown_token", message: "Onbekende QR-code." }
  }
  if (!["approved", "checked_in", "checked_out"].includes(person.status)) {
    return {
      kind: "not_approved",
      person,
      message: "Deze persoon is niet (meer) goedgekeurd.",
    }
  }
  if (!person.approved_days.includes(day)) {
    return {
      kind: "wrong_day",
      person,
      message: `${person.first_name} is niet goedgekeurd voor deze dag.`,
    }
  }
  const allowance = getMealAllowance(person, day, meal)
  if (allowance === 0) {
    return {
      kind: "not_eligible",
      person,
      meal,
      message: `Geen ${MEAL_LABEL[meal]} aangevraagd voor deze dag.`,
    }
  }
  const used = countMealRedemptions(redemptions, person.id, day, meal)
  if (used >= allowance) {
    const last = redemptions
      .filter(
        (r) => r.person_id === person.id && r.day === day && r.meal === meal
      )
      .sort((a, b) => b.redeemed_at.localeCompare(a.redeemed_at))[0]
    return {
      kind: "already_redeemed",
      person,
      allowance,
      used,
      lastAt: last?.redeemed_at,
      message: `${person.first_name} heeft alle ${allowance} ${MEAL_LABEL[meal]}-porties al opgehaald.`,
    }
  }
  return {
    kind: "ok",
    person,
    allowance,
    remaining: allowance - used - 1, // na deze claim
  }
}
