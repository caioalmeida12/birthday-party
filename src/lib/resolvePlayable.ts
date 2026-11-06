import { extractYouTubeId } from './mediaIds'
import type { Song } from './songs'
import { searchFirstYouTubeVideoId } from './youtubeSearch'

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
  const found = await searchFirstYouTubeVideoId(query)
  if (!found) {
    throw new Error(`Não achei uma versão tocável para “${song.title}”.`)
  }

  memoryCache.set(song.id, found)
  writeSessionCache(song, found)
  return found
}
