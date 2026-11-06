import { useEffect, useState } from 'react'
import { resolvePlayableVideoId } from '../lib/resolvePlayable'
import type { Song } from '../lib/songs'
import { directSongThumbUrl, youtubeThumbUrl } from '../lib/thumbnails'

type Props = {
  song: Song
  className?: string
}

export function SongThumb({ song, className = 'song-thumb' }: Props) {
  const [src, setSrc] = useState<string | null>(() => directSongThumbUrl(song.url))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const direct = directSongThumbUrl(song.url)
    if (direct) {
      setSrc(direct)
      setFailed(false)
      return
    }

    let cancelled = false
    setSrc(null)
    setFailed(false)

    void resolvePlayableVideoId(song)
      .then((videoId) => {
        if (!cancelled) setSrc(youtubeThumbUrl(videoId, 'mq'))
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [song.id, song.url, song.title, song.artist])

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
