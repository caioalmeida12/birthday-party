import { useEffect, useState } from 'react'
import { copy } from '../lib/copy'
import {
  listLivePhotos,
  rejectPhoto,
  subscribeToLivePhotos,
  type Photo,
} from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'
import { GuestQr } from './GuestQr'

const ROTATE_MS = 8000

type Props = {
  canModerate?: boolean
}

export function LivePhotoStage({ canModerate = false }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [index, setIndex] = useState(0)

  async function refresh() {
    const data = await listLivePhotos()
    setPhotos(data)
    setIndex((current) => (data.length === 0 ? 0 : current % data.length))
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

  useEffect(() => {
    if (photos.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % photos.length)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [photos.length])

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

  const empty = !loading && photos.length === 0
  const current = photos[index] ?? null

  return (
    <div className={`host-photo-stage${empty ? ' host-photo-stage-empty' : ''}`}>
      {loading ? <p className="muted host-photo-stage-msg">Carregando…</p> : null}
      {empty ? (
        <div className="host-live-empty host-photo-stage-empty-body">
          <p>{copy.hostLiveEmpty}</p>
          <p className="host-live-empty-hint">{copy.hostLiveEmptyHint}</p>
          <GuestQr
            path="camera"
            size={140}
            title={copy.hostQrCameraTitle}
            hint={copy.hostQrCameraHint}
            alt={copy.hostQrCameraAlt}
          />
        </div>
      ) : null}
      {error ? <p className="form-msg form-msg-error host-photo-stage-msg">{error}</p> : null}
      {current ? (
        <figure className="host-photo-slide">
          <div className="host-photo-media">
            <img
              key={current.id}
              src={current.publicUrl}
              alt={current.submitted_by || 'Foto ao vivo'}
            />
          </div>
          <figcaption>
            <span>{current.submitted_by || copy.photoModAnonymous}</span>
            <span className="host-photo-count">
              {index + 1}/{photos.length}
            </span>
            {canModerate ? (
              <button
                type="button"
                className="btn btn-ghost btn-tiny"
                disabled={busyId === current.id}
                onClick={() => {
                  void onRemove(current)
                }}
              >
                {copy.hostLiveRemove}
              </button>
            ) : null}
          </figcaption>
        </figure>
      ) : null}
    </div>
  )
}
