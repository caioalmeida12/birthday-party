import { useEffect, useMemo, useState } from 'react'
import { buildMasonryColumns, type MosaicItem } from '../lib/mosaicLayout'
import { listMosaicPhotos } from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'

const DEFAULT_ASPECT = 1
const COLUMN_WIDTH = 132
const GAP = 4

function probeAspect(src: string): Promise<number> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        resolve(image.naturalWidth / image.naturalHeight)
      } else {
        resolve(DEFAULT_ASPECT)
      }
    }
    image.onerror = () => resolve(DEFAULT_ASPECT)
    image.src = src
  })
}

/** Mosaico full-screen (masonry) + carrossel horizontal contínuo. */
export function PhotoMosaic() {
  const [items, setItems] = useState<MosaicItem[]>([])
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  }))

  useEffect(() => {
    function onResize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    void (async () => {
      try {
        const photos = await listMosaicPhotos()
        if (cancelled || photos.length === 0) {
          if (!cancelled) setItems([])
          return
        }

        const probed = await Promise.all(
          photos.map(async (photo) => ({
            id: photo.id,
            src: photo.publicUrl,
            aspect: await probeAspect(photo.publicUrl),
          })),
        )
        if (!cancelled) setItems(probed)
      } catch {
        if (!cancelled) setItems([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const columns = useMemo(
    () =>
      buildMasonryColumns(items, {
        columnWidth: COLUMN_WIDTH,
        targetHeight: viewport.height + 80,
        targetWidth: Math.max(viewport.width * 1.6, COLUMN_WIDTH * 8),
        gap: GAP,
      }),
    [items, viewport.height, viewport.width],
  )

  const stripWidth = columns.length * (COLUMN_WIDTH + GAP)

  if (columns.length === 0) return null

  function renderStrip(prefix: string) {
    return (
      <div className="photo-mosaic-strip" style={{ width: stripWidth }}>
        {columns.map((column, columnIndex) => (
          <div
            key={`${prefix}-col-${columnIndex}`}
            className="photo-mosaic-column"
            style={{ width: COLUMN_WIDTH, gap: GAP }}
          >
            {column.tiles.map((tile) => (
              <img
                key={`${prefix}-${tile.id}`}
                src={tile.src}
                alt=""
                className="photo-mosaic-tile"
                style={{ width: tile.width, height: tile.height }}
                loading="lazy"
                draggable={false}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="photo-mosaic" aria-hidden="true">
      <div
        className="photo-mosaic-track"
        style={{
          width: stripWidth * 2,
          ['--mosaic-shift' as string]: `-${stripWidth}px`,
        }}
      >
        {renderStrip('a')}
        {renderStrip('b')}
      </div>
      <div className="photo-mosaic-veil" />
    </div>
  )
}
