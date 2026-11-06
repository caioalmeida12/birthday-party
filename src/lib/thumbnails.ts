import { extractYouTubeId } from './mediaIds'

export function youtubeThumbUrl(videoId: string, quality: 'hq' | 'mq' = 'hq'): string {
  const file = quality === 'mq' ? 'mqdefault.jpg' : 'hqdefault.jpg'
  return `https://i.ytimg.com/vi/${videoId}/${file}`
}

/** Thumbnail imediata se a URL já for YouTube; senão null (resolver depois). */
export function directSongThumbUrl(songUrl: string): string | null {
  const id = extractYouTubeId(songUrl)
  return id ? youtubeThumbUrl(id) : null
}
