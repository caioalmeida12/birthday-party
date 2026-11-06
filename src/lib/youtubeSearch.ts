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

/** Converte itens crus do Piped em candidatos de música (puro, testável). */
export function mapPipedItemsToCandidates(
  items: PipedSearchItem[],
  limit = 3,
): SongSearchCandidate[] {
  const candidates: SongSearchCandidate[] = []
  const seen = new Set<string>()

  for (const item of items) {
    if (item.type && item.type !== 'stream') continue
    if (!item.url) continue
    const videoId = extractIdFromPipedUrl(item.url)
    if (!videoId || seen.has(videoId)) continue

    const rawTitle = item.title?.trim() || 'Música'
    const parsed = parseYouTubeMetadata(rawTitle, item.uploaderName ?? '')
    candidates.push({
      videoId,
      url: youtubeWatchUrl(videoId),
      title: parsed.title,
      artist: parsed.artist,
      thumbnailUrl: thumbnailFromItem(item),
    })
    seen.add(videoId)
    if (candidates.length >= limit) break
  }

  return candidates
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
      const candidates = mapPipedItemsToCandidates(data.items ?? [], limit)
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
