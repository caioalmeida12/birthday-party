import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useGuestNickname } from '../components/GuestSession'
import { NicknameField } from '../components/NicknameField'
import { MAX_PHOTO_BYTES } from '../lib/config'
import { copy } from '../lib/copy'
import { listPhotos, uploadPhoto, type Photo } from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'

export function Photos() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submittedBy, setSubmittedBy, persistNickname] = useGuestNickname()

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false

    void (async () => {
      try {
        const data = await listPhotos()
        if (!cancelled) setPhotos(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar as fotos.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null
    setError(null)
    setSuccess(null)
    if (preview) URL.revokeObjectURL(preview)
    setFile(next)
    setPreview(next ? URL.createObjectURL(next) : null)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSuccess(null)
    setError(null)

    if (!file) {
      setError(copy.cameraNeedPhoto)
      return
    }

    setSubmitting(true)
    try {
      await uploadPhoto({ file, submittedBy, kind: 'decor' })
      persistNickname()
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setSuccess(copy.photosOk)
      if (inputRef.current) inputRef.current.value = ''
      const data = await listPhotos()
      setPhotos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra enviar a foto.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>{copy.photosTitle}</h1>
        <p>{copy.photosLead(Math.round(MAX_PHOTO_BYTES / (1024 * 1024)))}</p>
      </header>

      <form className="panel form" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          id="photo-file"
          className="camera-file-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPick}
        />

        {preview ? (
          <div className="camera-preview">
            <img src={preview} alt="" />
          </div>
        ) : (
          <button
            className="btn btn-primary btn-lg welcome-full"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            {copy.photosCapture}
          </button>
        )}

        {preview ? (
          <div className="camera-actions">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              {copy.cameraRetake}
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting || !isSupabaseConfigured}
            >
              {submitting ? copy.photosSubmitting : copy.photosSubmit}
            </button>
          </div>
        ) : null}

        <NicknameField value={submittedBy} onChange={setSubmittedBy} placeholder="Seu nome" />
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        {success ? <p className="form-msg form-msg-ok">{success}</p> : null}
      </form>

      <div className="panel list-panel">
        <h2>{copy.photosListTitle}</h2>
        {loading ? <p className="muted">Carregando…</p> : null}
        {!loading && photos.length === 0 ? <p className="muted">{copy.photosEmpty}</p> : null}
        <div className="photo-grid">
          {photos.map((photo, index) => (
            <figure
              key={photo.id}
              className="photo-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <img src={photo.publicUrl} alt={photo.submitted_by || 'Foto da festa'} loading="lazy" />
              {photo.submitted_by ? <figcaption>{photo.submitted_by}</figcaption> : null}
            </figure>
          ))}
        </div>
      </div>

      <p className="camera-foot muted">
        <Link to="/musicas">{copy.cameraAlsoMusic}</Link>
      </p>
    </section>
  )
}
