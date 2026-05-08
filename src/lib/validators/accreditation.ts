import { z } from "zod"

export const PersonStatusSchema = z.enum([
  "draft",
  "approved",
  "rejected",
  "checked_in",
  "checked_out",
])

export const GroupTypeSchema = z.enum([
  "crew",
  "artist",
  "supplier",
  "press",
  "vip",
  "other",
])

export const ItemCategorySchema = z.enum([
  "wristband",
  "equipment",
  "parking",
  "other",
])

export const ItemScopeSchema = z.enum(["per_person", "per_day"])

export const MealTypeSchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "nightsnack",
])

const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Kleur moet een hex-code zijn (#RRGGBB)")

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum moet YYYY-MM-DD zijn")

export const CreatePersonSchema = z.object({
  project_id: z.string().uuid(),
  group_id: z.string().uuid(),
  first_name: z.string().min(1, "Voornaam is verplicht"),
  last_name: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().optional(),
  valid_days: z.array(IsoDateSchema).default([]),
  notes: z.string().max(500).optional(),
})

export const UpdatePersonSchema = CreatePersonSchema.partial().extend({
  id: z.string().uuid(),
})

export const ApprovePersonSchema = z.object({
  personId: z.string().uuid(),
  days: z.array(IsoDateSchema).min(1, "Minstens één dag is verplicht"),
  reason: z.string().optional(),
})

export const RejectPersonSchema = z.object({
  personId: z.string().uuid(),
  reason: z.string().min(3, "Reden van afwijzing is verplicht"),
})

export const BulkApproveSchema = z.object({
  personIds: z.array(z.string().uuid()).min(1),
  days: z.array(IsoDateSchema).min(1),
})

export const CreateGroupSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  type: GroupTypeSchema,
  max_persons: z.number().int().positive().optional(),
  item_limits: z.record(z.string(), z.number().int().nonnegative()).default({}),
})

export const UpdateGroupSchema = CreateGroupSchema.partial().extend({
  id: z.string().uuid(),
})

export const UpsertZoneSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  name: z.string().min(1),
  color: HexColorSchema,
  capacity: z.number().int().positive().optional(),
  sort_order: z.number().int().nonnegative().default(0),
})

export const UpsertItemTypeSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  name: z.string().min(1),
  total_available: z.number().int().nonnegative().optional(),
  variants: z.array(z.string()).default([]),
  sort_order: z.number().int().nonnegative().default(0),
  color: HexColorSchema.optional(),
  category: ItemCategorySchema,
  scope: ItemScopeSchema,
}).refine(
  (data) => data.category !== "wristband" || !!data.color,
  { message: "Polsbandjes vereisen een kleur", path: ["color"] }
)

export const CheckInQrSchema = z.object({
  qrToken: z.string().min(1),
  projectId: z.string().uuid(),
})

export const PortalSubmitSchema = z.object({
  token: z.string().min(1),
  persons: z.array(
    z.object({
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      email: z.string().email().optional().or(z.literal("")),
      role: z.string().optional(),
      valid_days: z.array(IsoDateSchema),
      meal_selections: z.record(IsoDateSchema, z.array(MealTypeSchema)).default({}),
      item_requests: z
        .array(
          z.object({
            item_type_id: z.string().uuid(),
            quantity: z.number().int().positive(),
            selected_variant: z.string().optional(),
            day: IsoDateSchema.optional(),
          })
        )
        .default([]),
    })
  ).min(1),
})

export const CreateBriefingSchema = z.object({
  project_id: z.string().uuid(),
  group_id: z.string().uuid().optional(),
  title: z.string().min(1),
  content: z.string().default(""),
  file_url: z.string().url().optional(),
  mandatory: z.boolean().default(false),
})

export const AcknowledgeBriefingSchema = z.object({
  briefingId: z.string().uuid(),
  personId: z.string().uuid(),
})

export type CreatePersonInput = z.infer<typeof CreatePersonSchema>
export type ApprovePersonInput = z.infer<typeof ApprovePersonSchema>
export type RejectPersonInput = z.infer<typeof RejectPersonSchema>
export type BulkApproveInput = z.infer<typeof BulkApproveSchema>
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>
export type UpsertZoneInput = z.infer<typeof UpsertZoneSchema>
export type UpsertItemTypeInput = z.infer<typeof UpsertItemTypeSchema>
export type CheckInQrInput = z.infer<typeof CheckInQrSchema>
export type PortalSubmitInput = z.infer<typeof PortalSubmitSchema>
export type CreateBriefingInput = z.infer<typeof CreateBriefingSchema>
