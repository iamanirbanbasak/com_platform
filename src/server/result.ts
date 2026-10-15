export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'EXPIRED'
  | 'USED'
  | 'REVOKED'
  | 'CLUB_ARCHIVED'
  | 'ALREADY_MEMBER'

export type DomainError = { code: ErrorCode; message: string }

export type Result<T, E = DomainError> = { ok: true; value: T } | { ok: false; error: E }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function fail(code: ErrorCode, message: string): Result<never> {
  return { ok: false, error: { code, message } }
}
