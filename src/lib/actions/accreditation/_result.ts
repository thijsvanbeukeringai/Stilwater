export type ActionError =
  | { code: "UNAUTHORIZED"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "VALIDATION_FAILED"; message: string; fields?: Record<string, string[]> }
  | { code: "RATE_LIMITED"; message: string; retryAfter?: number }
  | { code: "CONFLICT"; message: string }
  | { code: "INTERNAL"; message: string }

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError }

export const ok = <T>(data: T): ActionResult<T> => ({ success: true, data })

export const fail = (error: ActionError): ActionResult<never> => ({
  success: false,
  error,
})
