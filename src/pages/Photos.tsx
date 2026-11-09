import { useEffect, useRef, useState, type ChangeEvent } from 'react'
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
  const [preview, setPreview] = useState<string | null>(null)
  const [submittedBy, setSubmittedBy, persistNickname] = useGuestNickname()
  const previewRef = useRef<string | null>(null)

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
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  function replacePreview(nextUrl: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = nextUrl
    setPreview(nextUrl)
  }

  async function uploadSelected(file: File) {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    replacePreview(URL.createObjectURL(file))

    try {
      await uploadPhoto({ file, submittedBy, kind: 'decor' })
      persistNickname()
      replacePreview(null)
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

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null
    if (!next) return
    void uploadSelected(next)
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>{copy.photosTitle}</h1>
        <p>{copy.photosLead(Math.round(MAX_PHOTO_BYTES / (1024 * 1024)))}</p>
      </header>

      <div className="panel form">
        <input
          ref={inputRef}
          id="photo-file"
          className="camera-file-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPick}
          disabled={submitting || !isSupabaseConfigured}
        />

        {preview ? (
          <div className="camera-preview">
            <img src={preview} alt="" />
          </div>
        ) : null}

        <button
          className="btn btn-primary btn-lg welcome-full"
          type="button"
          disabled={submitting || !isSupabaseConfigured}
          onClick={() => inputRef.current?.click()}
        >
          {submitting ? copy.photosSubmitting : copy.photosCapture}
        </button>

        {preview && error ? (
          <button
            className="btn btn-ghost welcome-full"
            type="button"
            disabled={submitting}
            onClick={() => inputRef.current?.click()}
          >
            {copy.cameraRetake}
          </button>
        ) : null}

        <NicknameField value={submittedBy} onChange={setSubmittedBy} placeholder="Seu nome" />
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        {success ? <p className="form-msg form-msg-ok">{success}</p> : null}
      </div>

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
