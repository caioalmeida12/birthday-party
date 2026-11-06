import { useEffect, useState } from 'react'
import { copy } from '../lib/copy'
import {
  listLivePhotos,
  rejectPhoto,
  subscribeToLivePhotos,
  type Photo,
} from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'

type Props = {
  canModerate?: boolean
}

export function LivePhotoWall({ canModerate = false }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    const data = await listLivePhotos()
    setPhotos(data)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false

    void (async () => {
      try {
        const data = await listLivePhotos()
        if (!cancelled) setPhotos(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar fotos ao vivo.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const unsubscribe = subscribeToLivePhotos(() => {
      void refresh().catch(() => undefined)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  async function onRemove(photo: Photo) {
    setBusyId(photo.id)
    setError(null)
    try {
      await rejectPhoto(photo)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra apagar.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="host-wall host-live-wall">
      <header className="host-wall-header">
        <h2>{copy.hostLiveTitle}</h2>
      </header>
      {loading ? <p className="muted">Carregando…</p> : null}
      {!loading && photos.length === 0 ? <p className="muted">{copy.hostLiveEmpty}</p> : null}
      {error ? <p className="form-msg form-msg-error">{error}</p> : null}
      <div className="live-photo-grid">
        {photos.map((photo) => (
          <figure key={photo.id} className="live-photo-card">
            <img src={photo.publicUrl} alt={photo.submitted_by || 'Foto ao vivo'} loading="lazy" />
            <figcaption>
              <span>{photo.submitted_by || copy.photoModAnonymous}</span>
              {canModerate ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-tiny"
                  disabled={busyId === photo.id}
                  onClick={() => {
                    void onRemove(photo)
                  }}
                >
                  {copy.hostLiveRemove}
                </button>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
