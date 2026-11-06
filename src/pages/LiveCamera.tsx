import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useGuestNickname } from '../components/GuestSession'
import { copy } from '../lib/copy'
import { uploadPhoto } from '../lib/photos'
import { isSupabaseConfigured } from '../lib/supabase'

export function LiveCamera() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submittedBy, , persistNickname] = useGuestNickname()

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null
    setError(null)
    setSuccess(null)
    if (preview) URL.revokeObjectURL(preview)
    setFile(next)
    setPreview(next ? URL.createObjectURL(next) : null)
  }

  function openCamera() {
    inputRef.current?.click()
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    if (!file) {
      setError(copy.cameraNeedPhoto)
      return
    }
    setSubmitting(true)
    try {
      await uploadPhoto({ file, submittedBy, kind: 'live' })
      persistNickname()
      setSuccess(copy.photosOkLive)
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra enviar a foto.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page camera-page">
      <header className="page-header">
        <h1>{copy.cameraTitle}</h1>
        <p>{copy.cameraLead}</p>
      </header>

      <form className="panel form camera-form" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          id="live-camera-file"
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
          <button className="camera-shutter" type="button" onClick={openCamera}>
            {copy.cameraShutter}
          </button>
        )}

        {preview ? (
          <div className="camera-actions">
            <button className="btn btn-ghost" type="button" onClick={openCamera}>
              {copy.cameraRetake}
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting || !isSupabaseConfigured}
            >
              {submitting ? copy.photosSubmitting : copy.cameraSend}
            </button>
          </div>
        ) : null}

        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        {success ? <p className="form-msg form-msg-ok">{success}</p> : null}
      </form>

      <p className="camera-foot muted">
        <Link to="/musicas">{copy.cameraAlsoMusic}</Link>
      </p>
    </section>
  )
}
