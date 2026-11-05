const ALLOWED_HOSTS = new Set([
  'open.spotify.com',
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'm.youtube.com',
  'music.youtube.com',
])

const YOUTUBE_KEEP_PARAMS = new Set(['v', 'list'])

export function isAllowedMusicUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw.trim())
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false
    }
    return ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export function normalizeMusicUrl(raw: string): string {
  const trimmed = raw.trim()
  try {
    const parsed = new URL(trimmed)
    parsed.hash = ''
    const hostname = parsed.hostname.toLowerCase()

    if (hostname === 'open.spotify.com') {
      parsed.search = ''
      return parsed.toString()
    }

    // YouTube identity lives in ?v= for /watch URLs.
    const kept = new URLSearchParams()
    for (const key of YOUTUBE_KEEP_PARAMS) {
      const value = parsed.searchParams.get(key)
      if (value) kept.set(key, value)
    }
    parsed.search = kept.toString()
    return parsed.toString()
  } catch {
    return trimmed
  }
}
