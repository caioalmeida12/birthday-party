import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useGuestNickname } from '../components/GuestSession'
import { NicknameField } from '../components/NicknameField'
import { MAX_PHOTO_BYTES } from '../lib/config'
import { copy } from '../lib/copy'
import { filesFromPhotoPicker, guestPhotoFileInputAttrs } from '../lib/photoPicker'
import { listPhotos, uploadPhoto, type Photo } from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'

export function Photos() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
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

  async function uploadSelected(files: File[]) {
    if (files.length === 0) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setProgress(null)

    let ok = 0
    const failures: string[] = []

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        replacePreview(URL.createObjectURL(file))
        if (files.length > 1) {
          setProgress(copy.photosProgress(index + 1, files.length))
        }

        try {
          await uploadPhoto({ file, submittedBy, kind: 'decor' })
          ok += 1
        } catch (err) {
          const reason =
            err instanceof Error ? err.message : 'Não deu pra enviar a foto.'
          failures.push(`${file.name || 'foto'}: ${reason}`)
        }
      }

      if (ok > 0) persistNickname()
      replacePreview(null)
      if (inputRef.current) inputRef.current.value = ''

      if (ok > 0) {
        setSuccess(ok === 1 ? copy.photosOk : copy.photosOkMany(ok))
        const data = await listPhotos()
        setPhotos(data)
      }

      if (failures.length > 0) {
        setError(
          ok === 0
            ? failures[0]
            : copy.photosPartialFail(ok, failures.length),
        )
      }
    } finally {
      setProgress(null)
      setSubmitting(false)
    }
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const next = filesFromPhotoPicker(event.target.files)
    if (next.length === 0) {
      setError(copy.cameraNeedPhoto)
      return
    }
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
          {...guestPhotoFileInputAttrs({ multiple: true })}
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
          {submitting
            ? progress ?? copy.photosSubmitting
            : copy.photosCapture}
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
