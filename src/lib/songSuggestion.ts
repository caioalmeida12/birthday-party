import { isAllowedMusicUrl, normalizeMusicUrl } from './urlValidation'

export type ClassifiedSongInput =
  | { kind: 'music-url'; url: string }
  | { kind: 'query'; query: string }
  | { kind: 'bad-url' }

function tryAsMusicUrl(raw: string): string | null {
  const trimmed = raw.trim()
  const candidates = [trimmed]
  if (!/^https?:\/\//i.test(trimmed)) {
    candidates.push(`https://${trimmed}`)
  }

  for (const candidate of candidates) {
    if (isAllowedMusicUrl(candidate)) {
      return normalizeMusicUrl(candidate)
    }
  }
  return null
}

/** Heurística: parece tentativa de link, mas não é Spotify/YouTube aceito. */
export function looksLikeUrlAttempt(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  if (/^https?:\/\//i.test(trimmed)) return true
  if (/^www\./i.test(trimmed)) return true
  if (/^(open\.spotify\.com|youtu\.be|((www|m|music)\.)?youtube\.com)\b/i.test(trimmed)) {
    return true
  }
  return false
}

/**
 * Decide se o texto do convidado é link de música ou nome pra buscar.
 */
export function classifySongInput(raw: string): ClassifiedSongInput {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { kind: 'query', query: '' }
  }

  const url = tryAsMusicUrl(trimmed)
  if (url) {
    return { kind: 'music-url', url }
  }

  if (looksLikeUrlAttempt(trimmed)) {
    return { kind: 'bad-url' }
  }

  return { kind: 'query', query: trimmed }
}
