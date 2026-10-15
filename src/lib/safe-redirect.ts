const BASE = 'http://same-origin.invalid'

/**
 * Only allow same-site relative paths, so `?next=` can't send users off-site.
 * Parsing with URL (rather than prefix checks) catches tricks like "/\t/evil.com",
 * which browsers normalise to the protocol-relative "//evil.com".
 */
export function safeRedirect(target: string | null | undefined, fallback = '/'): string {
  if (!target || !target.startsWith('/')) return fallback
  try {
    const url = new URL(target, BASE)
    if (url.origin !== BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
