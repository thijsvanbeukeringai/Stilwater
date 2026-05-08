import type { Role } from "@/types/accreditation"

/**
 * Stub auth helper. Replaced by Supabase Auth integration in a later phase.
 * For now: returns a mock super_admin user so server actions can be exercised
 * end-to-end without a live session.
 */
export async function requireRole(allowed: Role[]): Promise<{
  id: string
  email: string
  role: Role
} | null> {
  const user = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "thijs@local.dev",
    role: "super_admin" as Role,
  }
  if (!allowed.includes(user.role)) return null
  return user
}
