import { useEffect, useState } from 'react'
import { resolvePlayableVideoId } from '../lib/resolvePlayable'
import type { Song } from '../lib/songs'
import { directSongThumbUrl, youtubeThumbUrl } from '../lib/thumbnails'

type Props = {
  song: Song
  className?: string
}

export function SongThumb({ song, className = 'song-thumb' }: Props) {
  const direct = directSongThumbUrl(song.url)
  const [resolved, setResolved] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const src = direct ?? resolved

  useEffect(() => {
    if (direct) {
      setResolved(null)
      setFailed(false)
      return
    }

    let cancelled = false
    setResolved(null)
    setFailed(false)

    void resolvePlayableVideoId(song)
      .then((videoId) => {
        if (!cancelled) setResolved(youtubeThumbUrl(videoId, 'mq'))
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [direct, song])

  if (failed || !src) {
    return <span className={`${className} song-thumb-empty`} aria-hidden />
  }

  return (
    <img
      className={className}
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
