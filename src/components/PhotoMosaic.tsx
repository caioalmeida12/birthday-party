import { useEffect, useMemo, useState } from 'react'
import { listPhotos, type Photo } from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'

const MIN_TILES = 24

function fillTiles(photos: Photo[], min: number): Photo[] {
  if (photos.length === 0) return []
  const tiles: Photo[] = []
  while (tiles.length < Math.max(min, photos.length)) {
    for (const photo of photos) {
      tiles.push(photo)
      if (tiles.length >= min && tiles.length >= photos.length) break
    }
  }
  return tiles
}

/** Mosaico das fotos aprovadas — fundo da home. */
export function PhotoMosaic() {
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    void listPhotos()
      .then((data) => {
        if (!cancelled) setPhotos(data)
      })
      .catch(() => {
        if (!cancelled) setPhotos([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  const tiles = useMemo(() => fillTiles(photos, MIN_TILES), [photos])

  if (tiles.length === 0) return null

  return (
    <div className="photo-mosaic" aria-hidden="true">
      <div className="photo-mosaic-grid">
        {tiles.map((photo, index) => (
          <img
            key={`${photo.id}-${index}`}
            src={photo.publicUrl}
            alt=""
            loading={index < 12 ? 'eager' : 'lazy'}
            className="photo-mosaic-tile"
            style={{ animationDelay: `${(index % 12) * 40}ms` }}
          />
        ))}
      </div>
      <div className="photo-mosaic-veil" />
    </div>
  )
}
