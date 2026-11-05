import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { SongVoteControls } from '../components/SongVoteControls'
import {
  castSongVote,
  createSong,
  listSongs,
  skipSong,
  sortSongsForBoard,
  subscribeToPlaylist,
  unskipSong,
  type Song,
} from '../lib/songs'
import { isSupabaseConfigured } from '../lib/supabase'
import { isAllowedMusicUrl } from '../lib/urlValidation'

export function Songs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [submitting, setSubmitting] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [url, setUrl] = useState('')
  const [submittedBy, setSubmittedBy] = useState('')

  async function refreshSongs() {
    const data = await listSongs()
    setSongs(sortSongsForBoard(data))
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false

    void (async () => {
      try {
        const data = await listSongs()
        if (!cancelled) setSongs(sortSongsForBoard(data))
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

    const unsubscribe = subscribeToPlaylist(() => {
      void refreshSongs().catch(() => undefined)
    })

    return () => {
      cancelled = true
      unsubscribe()
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
      await createSong({ url, submittedBy })
      await refreshSongs()
      setUrl('')
      setSubmittedBy('')
      setSuccess('Música adicionada à playlist!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar a música.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVote(songId: string, vote: 1 | -1) {
    setVotingId(songId)
    setError(null)
    try {
      const data = await castSongVote(songId, vote)
      setSongs(sortSongsForBoard(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao votar.')
    } finally {
      setVotingId(null)
    }
  }

  async function handleSkipToggle(song: Song) {
    setVotingId(song.id)
    setError(null)
    try {
      const data = song.skipped ? await unskipSong(song.id) : await skipSong(song.id)
      setSongs(sortSongsForBoard(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao dar skip.')
    } finally {
      setVotingId(null)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Playlist da festa</h1>
        <p>Cola o link, vote e dê skip no que não rola. A fila do player segue o placar.</p>
        <p className="page-header-action">
          <Link className="btn btn-ghost" to="/tocar">
            Abrir player da festa
          </Link>
        </p>
      </header>

      <form className="panel form" onSubmit={onSubmit}>
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
          {submitting ? 'Descobrindo e enviando…' : 'Adicionar à playlist'}
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
            <li
              key={song.id}
              className={song.skipped ? 'song-item song-item-skipped' : 'song-item'}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="song-main">
                <a href={song.url} target="_blank" rel="noreferrer">
                  {song.title}
                </a>
                <span className="song-artist">{song.artist}</span>
                {song.submitted_by ? (
                  <span className="song-by">por {song.submitted_by}</span>
                ) : null}
              </div>
              <SongVoteControls
                song={song}
                disabled={votingId === song.id || !isSupabaseConfigured}
                onUpvote={(id) => {
                  void handleVote(id, 1)
                }}
                onDownvote={(id) => {
                  void handleVote(id, -1)
                }}
                onSkipToggle={(item) => {
                  void handleSkipToggle(item)
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
