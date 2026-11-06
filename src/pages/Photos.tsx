import { useEffect, useState, type FormEvent } from 'react'
import { useGuestNickname } from '../components/GuestSession'
import { NicknameField } from '../components/NicknameField'
import { MAX_PHOTO_BYTES } from '../lib/config'
import { copy } from '../lib/copy'
import { listPhotos, uploadPhoto, type Photo } from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'

export function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
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
          setError(
            err instanceof Error ? err.message : 'Não foi possível carregar as fotos.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSuccess(null)
    setError(null)

    if (!file) {
      setError('Escolhe um arquivo de imagem.')
      return
    }

    setSubmitting(true)
    try {
      await uploadPhoto({ file, submittedBy })
      // Não coloca na galeria: fica pendente até o anfitrião aprovar (convidado não vê isso).
      persistNickname()
      setFile(null)
      setSuccess(copy.photosOk)
      const input = document.getElementById('photo-file') as HTMLInputElement | null
      if (input) input.value = ''
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
        <label>
          {copy.photosField}
          <input
            id="photo-file"
            required
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <NicknameField value={submittedBy} onChange={setSubmittedBy} placeholder="Seu nome" />
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        {success ? <p className="form-msg form-msg-ok">{success}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={submitting || !isSupabaseConfigured}>
          {submitting ? copy.photosSubmitting : copy.photosSubmit}
        </button>
      </form>

      <div className="panel list-panel">
        <h2>{copy.photosListTitle}</h2>
        {loading ? <p className="muted">Carregando…</p> : null}
        {!loading && photos.length === 0 ? (
          <p className="muted">{copy.photosEmpty}</p>
        ) : null}
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
    </section>
  )
}
