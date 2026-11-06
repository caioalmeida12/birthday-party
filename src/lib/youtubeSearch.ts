import { parseYouTubeMetadata } from './resolveMusicMetadata'

const PIPED_BASES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.reallyaweso.me',
]

type PipedSearchItem = {
  url?: string
  type?: string
  title?: string
  uploaderName?: string
  thumbnail?: string | { url?: string }
}

type PipedSearchResponse = {
  items?: PipedSearchItem[]
}

export type SongSearchCandidate = {
  videoId: string
  url: string
  title: string
  artist: string
  thumbnailUrl: string | null
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function extractIdFromPipedUrl(path: string): string | null {
  const match =
    path.match(/[?&]v=([\w-]{11})/) ||
    path.match(/\/watch\?v=([\w-]{11})/) ||
    path.match(/([\w-]{11})$/)
  if (!match) return null
  const id = match[1]
  return id && /^[\w-]{11}$/.test(id) ? id : null
}

function thumbnailFromItem(item: PipedSearchItem): string | null {
  if (typeof item.thumbnail === 'string' && item.thumbnail.trim()) {
    return item.thumbnail.trim()
  }
  if (item.thumbnail && typeof item.thumbnail === 'object' && item.thumbnail.url) {
    return item.thumbnail.url.trim() || null
  }
  return null
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Pontua resultado vs. a busca do convidado (maior = melhor). */
export function scoreSearchCandidate(
  query: string,
  title: string,
  uploader: string,
): number {
  const q = normalize(query)
  const t = normalize(title)
  const u = normalize(uploader)
  if (!q || !t) return -100

  let score = 0
  const tokens = q.split(' ').filter((token) => token.length >= 2)
  for (const token of tokens) {
    if (t.includes(token)) score += 4
    if (u.includes(token)) score += 1
  }

  if (t.includes(q)) score += 6
  if (q.includes(t) && t.length >= 4) score += 3

  if (/\bvevo\b|\btopic\b|\bofficial\b/.test(u)) score += 5
  if (/\bofficial\b|\boficial\b|\baudio\b/.test(t)) score += 2

  if (/\bkaraoke\b|\bcaraok\b|\blyric|\bletra\b|\bcover\b|\bsped\s*up\b|\bslowed\b/.test(t)) {
    score -= 8
  }
  if (/\bkaraoke\b|\blyric/.test(u)) score -= 4

  return score
}

/** Converte itens crus do Piped em candidatos de música (puro, testável). */
export function mapPipedItemsToCandidates(
  items: PipedSearchItem[],
  limit = 3,
  query = '',
): SongSearchCandidate[] {
  const scored: Array<SongSearchCandidate & { score: number }> = []
  const seen = new Set<string>()

  for (const item of items) {
    if (item.type && item.type !== 'stream') continue
    if (!item.url) continue
    const videoId = extractIdFromPipedUrl(item.url)
    if (!videoId || seen.has(videoId)) continue

    const rawTitle = item.title?.trim() || 'Música'
    const uploader = item.uploaderName ?? ''
    const parsed = parseYouTubeMetadata(rawTitle, uploader)
    scored.push({
      videoId,
      url: youtubeWatchUrl(videoId),
      title: parsed.title,
      artist: parsed.artist,
      thumbnailUrl: thumbnailFromItem(item),
      score: scoreSearchCandidate(query || rawTitle, rawTitle, uploader),
    })
    seen.add(videoId)
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(({ score: _score, ...candidate }) => candidate)
}

export async function searchYouTubeSongs(
  query: string,
  limit = 3,
): Promise<SongSearchCandidate[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  for (const base of PIPED_BASES) {
    const endpoint =
      `${base}/search?` +
      new URLSearchParams({
        q: trimmed,
        filter: 'videos',
      }).toString()

    try {
      const response = await fetch(endpoint)
      if (!response.ok) continue
      const data = (await response.json()) as PipedSearchResponse
      const candidates = mapPipedItemsToCandidates(data.items ?? [], limit, trimmed)
      if (candidates.length > 0) return candidates
    } catch {
      // tenta a próxima instância
    }
  }

  return []
}

export async function searchFirstYouTubeVideoId(query: string): Promise<string | null> {
  const [first] = await searchYouTubeSongs(query, 1)
  return first?.videoId ?? null
}
