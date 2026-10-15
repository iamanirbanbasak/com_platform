import { fail, type Result } from '@/server/result'

/** The authenticated user a service call acts on behalf of. */
export type Actor = { id: string; role: 'admin' | 'user' }

export function isAdmin(actor: Actor | null): actor is Actor {
  return actor?.role === 'admin'
}

export function requireUser(actor: Actor | null): Result<Actor> {
  if (!actor) return fail('UNAUTHENTICATED', 'Please sign in to continue.')
  return { ok: true, value: actor }
}

export function requireAdmin(actor: Actor | null): Result<Actor> {
  if (!actor) return fail('UNAUTHENTICATED', 'Please sign in to continue.')
  if (!isAdmin(actor)) return fail('FORBIDDEN', 'Only the admin can do that.')
  return { ok: true, value: actor }
}
