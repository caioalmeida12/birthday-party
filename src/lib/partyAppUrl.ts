const FALLBACK_ORIGIN = 'https://caioalmeida12.github.io'

function appRootHref(): string {
  const base = import.meta.env.BASE_URL || '/'
  const origin = typeof window !== 'undefined' ? window.location.origin : FALLBACK_ORIGIN
  const root = new URL(base, origin)
  return root.href.endsWith('/') ? root.href : `${root.href}/`
}

/** URL pública do web app (pra QR na TV). `path` relativo, ex.: `camera`, `musicas`. */
export function partyAppUrl(path = ''): string {
  const root = appRootHref()
  const cleaned = path.replace(/^\//, '')
  if (!cleaned) return root
  return new URL(cleaned, root).href
}
