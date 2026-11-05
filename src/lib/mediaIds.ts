export function extractYouTubeId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim())
    const host = url.hostname.toLowerCase()

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }

    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com'
    ) {
      const fromQuery = url.searchParams.get('v')
      if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery

      const parts = url.pathname.split('/').filter(Boolean)
      if (
        (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') &&
        parts[1] &&
        /^[\w-]{11}$/.test(parts[1])
      ) {
        return parts[1]
      }
    }
  } catch {
    return null
  }
  return null
}

export function extractSpotifyTrackId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim())
    if (url.hostname.toLowerCase() !== 'open.spotify.com') return null
    const parts = url.pathname.split('/').filter(Boolean)
    // /track/ID or /intl-pt/track/ID
    const trackIndex = parts.findIndex((part) => part === 'track')
    if (trackIndex < 0) return null
    const id = parts[trackIndex + 1]
    return id && /^[a-zA-Z0-9]+$/.test(id) ? id : null
  } catch {
    return null
  }
}

export function detectProvider(rawUrl: string): 'spotify' | 'youtube' | 'unknown' {
  try {
    const host = new URL(rawUrl.trim()).hostname.toLowerCase()
    if (host === 'open.spotify.com') return 'spotify'
    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtu.be'
    ) {
      return 'youtube'
    }
  } catch {
    return 'unknown'
  }
  return 'unknown'
}
