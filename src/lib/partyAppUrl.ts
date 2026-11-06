/** URL pública do web app (pra QR na TV). */
export function partyAppUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  if (typeof window === 'undefined') {
    return `https://caioalmeida12.github.io${base.startsWith('/') ? base : `/${base}`}`
  }
  return new URL(base, window.location.origin).href
}
