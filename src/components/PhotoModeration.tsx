import { useCallback, useEffect, useState } from 'react'
import { copy } from '../lib/copy'
import {
  approvePhoto,
  listPendingPhotos,
  rejectPhoto,
  type Photo,
} from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'

export function PhotoModeration() {
  const [pending, setPending] = useState<Photo[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const data = await listPendingPhotos()
    setPending(data)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    void (async () => {
      try {
        await refresh()
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Não deu pra carregar as fotos.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [refresh])

  async function onApprove(photo: Photo) {
    setBusyId(photo.id)
    setError(null)
    try {
      await approvePhoto(photo.id)
      setPending((prev) => prev.filter((item) => item.id !== photo.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra aprovar.')
    } finally {
      setBusyId(null)
    }
  }

  async function onReject(photo: Photo) {
    setBusyId(photo.id)
    setError(null)
    try {
      await rejectPhoto(photo)
      setPending((prev) => prev.filter((item) => item.id !== photo.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra recusar.')
    } finally {
      setBusyId(null)
    }
  }

  if (!isSupabaseConfigured) return null

  return (
    <div className="panel list-panel">
      <h2>{copy.photoModTitle}</h2>
      <p className="muted moderate-help">{copy.photoModLead}</p>
      {loading ? <p className="muted">Carregando…</p> : null}
      {error ? <p className="form-msg form-msg-error">{error}</p> : null}
      {!loading && pending.length === 0 ? (
        <p className="muted">{copy.photoModEmpty}</p>
      ) : null}
      <ul className="photo-mod-list">
        {pending.map((photo) => (
          <li key={photo.id} className="photo-mod-item">
            <img src={photo.publicUrl} alt="" className="photo-mod-thumb" />
            <div className="photo-mod-meta">
              <strong>{photo.submitted_by || copy.photoModAnonymous}</strong>
              <div className="photo-mod-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busyId === photo.id}
                  onClick={() => {
                    void onApprove(photo)
                  }}
                >
                  {copy.photoModApprove}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-danger-ghost"
                  disabled={busyId === photo.id}
                  onClick={() => {
                    void onReject(photo)
                  }}
                >
                  {copy.photoModReject}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
