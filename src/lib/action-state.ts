import type { z } from 'zod'

import type { Result } from '@/server/result'

export type FieldErrors = Record<string, string[] | undefined>

export type ActionState = {
  ok: boolean
  message?: string
  fieldErrors?: FieldErrors
  /** Changes on every submit so client effects (toasts, resets) fire each time. */
  at?: number
} | null

export function fromResult(result: Result<unknown>, success: string): ActionState {
  if (result.ok) return { ok: true, message: success, at: Date.now() }
  return { ok: false, message: result.error.message, at: Date.now() }
}

export function invalid(error: z.ZodError): ActionState {
  const fieldErrors: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message]
  }
  return { ok: false, message: 'Check the highlighted fields.', fieldErrors, at: Date.now() }
}

/** Plain object from FormData, skipping file inputs. */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value
  }
  return values
}
