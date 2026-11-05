import { useEffect, useState, type FormEvent } from 'react'
import { MAX_PHOTO_BYTES } from '../lib/config'
import { listPhotos, uploadPhoto, type Photo } from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'

export function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submittedBy, setSubmittedBy] = useState('')

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
      setError('Escolha uma imagem.')
      return
    }

    setSubmitting(true)
    try {
      const photo = await uploadPhoto({ file, submittedBy })
      setPhotos((prev) => [photo, ...prev])
      setFile(null)
      setSubmittedBy('')
      setSuccess('Foto enviada! Vai entrar na decoração.')
      const input = document.getElementById('photo-file') as HTMLInputElement | null
      if (input) input.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar a foto.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Fotos pra decoração</h1>
        <p>
          Manda uma imagem (até {Math.round(MAX_PHOTO_BYTES / (1024 * 1024))} MB). Eu imprimo e
          uso na festa.
        </p>
      </header>

      <form className="panel form" onSubmit={onSubmit}>
        <label>
          Sua foto
          <input
            id="photo-file"
            required
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Seu apelido (opcional)
          <input
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            placeholder="Quem está na foto / quem enviou"
            autoComplete="nickname"
          />
        </label>
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        {success ? <p className="form-msg form-msg-ok">{success}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={submitting || !isSupabaseConfigured}>
          {submitting ? 'Enviando…' : 'Enviar foto'}
        </button>
      </form>

      <div className="panel list-panel">
        <h2>Galeria</h2>
        {loading ? <p className="muted">Carregando…</p> : null}
        {!loading && photos.length === 0 ? (
          <p className="muted">Nenhuma foto ainda — manda a primeira.</p>
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
