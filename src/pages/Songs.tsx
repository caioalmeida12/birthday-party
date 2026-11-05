import { useEffect, useState, type FormEvent } from 'react'
import { createSong, listSongs, type Song } from '../lib/songs'
import { isSupabaseConfigured } from '../lib/supabase'
import { isAllowedMusicUrl } from '../lib/urlValidation'

export function Songs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [url, setUrl] = useState('')
  const [submittedBy, setSubmittedBy] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false

    void (async () => {
      try {
        const data = await listSongs()
        if (!cancelled) setSongs(data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Não foi possível carregar as músicas.',
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

    if (!isAllowedMusicUrl(url)) {
      setError('Use um link do Spotify ou YouTube.')
      return
    }

    setSubmitting(true)
    try {
      const song = await createSong({ title, artist, url, submittedBy })
      setSongs((prev) => [song, ...prev])
      setTitle('')
      setArtist('')
      setUrl('')
      setSubmittedBy('')
      setSuccess('Música adicionada à playlist!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar a música.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Playlist da festa</h1>
        <p>Manda um link do Spotify ou YouTube. Eu monto a fila e a gente dança.</p>
      </header>

      <form className="panel form" onSubmit={onSubmit}>
        <label>
          Nome da música
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: September"
            autoComplete="off"
          />
        </label>
        <label>
          Artista
          <input
            required
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Ex.: Earth, Wind & Fire"
            autoComplete="off"
          />
        </label>
        <label>
          Link (Spotify ou YouTube)
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            autoComplete="off"
          />
        </label>
        <label>
          Seu apelido (opcional)
          <input
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            placeholder="Como te chamam na festa"
            autoComplete="nickname"
          />
        </label>
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        {success ? <p className="form-msg form-msg-ok">{success}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={submitting || !isSupabaseConfigured}>
          {submitting ? 'Enviando…' : 'Adicionar à playlist'}
        </button>
      </form>

      <div className="panel list-panel">
        <h2>Já sugeridas</h2>
        {loading ? <p className="muted">Carregando…</p> : null}
        {!loading && songs.length === 0 ? (
          <p className="muted">Nenhuma música ainda — seja a primeira pessoa.</p>
        ) : null}
        <ul className="song-list">
          {songs.map((song, index) => (
            <li key={song.id} className="song-item" style={{ animationDelay: `${index * 40}ms` }}>
              <div>
                <a href={song.url} target="_blank" rel="noreferrer">
                  {song.title}
                </a>
                <span className="song-artist">{song.artist}</span>
              </div>
              {song.submitted_by ? (
                <span className="song-by">por {song.submitted_by}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
