import { extractYouTubeId } from './mediaIds'
import type { Song } from './songs'

const PIPED_BASES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.reallyaweso.me',
]

type PipedSearchResponse = {
  items?: Array<{
    url?: string
    type?: string
    title?: string
  }>
}

const memoryCache = new Map<string, string>()

function cacheKey(song: Song): string {
  return `playable-yt:${song.id}`
}

function readSessionCache(song: Song): string | null {
  try {
    return sessionStorage.getItem(cacheKey(song))
  } catch {
    return null
  }
}

function writeSessionCache(song: Song, videoId: string): void {
  try {
    sessionStorage.setItem(cacheKey(song), videoId)
  } catch {
    // ignore quota / private mode
  }
}

function extractIdFromPipedUrl(path: string): string | null {
  const match = path.match(/[?&]v=([\w-]{11})/) || path.match(/\/watch\?v=([\w-]{11})/) || path.match(/([\w-]{11})$/)
  if (!match) return null
  const id = match[1]
  return id && /^[\w-]{11}$/.test(id) ? id : null
}

async function searchYouTubeViaPiped(query: string): Promise<string | null> {
  for (const base of PIPED_BASES) {
    const endpoint =
      `${base}/search?` +
      new URLSearchParams({
        q: query,
        filter: 'videos',
      }).toString()

    try {
      const response = await fetch(endpoint)
      if (!response.ok) continue
      const data = (await response.json()) as PipedSearchResponse
      const video = (data.items ?? []).find((item) => item.type === 'stream' && item.url)
      if (!video?.url) continue
      const id = extractIdFromPipedUrl(video.url)
      if (id) return id
    } catch {
      // try next instance
    }
  }
  return null
}

export async function resolvePlayableVideoId(song: Song): Promise<string> {
  const fromMemory = memoryCache.get(song.id)
  if (fromMemory) return fromMemory

  const fromSession = readSessionCache(song)
  if (fromSession) {
    memoryCache.set(song.id, fromSession)
    return fromSession
  }

  const direct = extractYouTubeId(song.url)
  if (direct) {
    memoryCache.set(song.id, direct)
    writeSessionCache(song, direct)
    return direct
  }

  const query = `${song.artist} ${song.title}`.trim()
  const found = await searchYouTubeViaPiped(query)
  if (!found) {
    throw new Error(`Não achei uma versão tocável para “${song.title}”.`)
  }

  memoryCache.set(song.id, found)
  writeSessionCache(song, found)
  return found
}
