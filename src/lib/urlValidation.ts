const ALLOWED_HOSTS = new Set([
  'open.spotify.com',
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'm.youtube.com',
  'music.youtube.com',
])

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
  return raw.trim()
}
