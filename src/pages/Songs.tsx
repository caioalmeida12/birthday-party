import { useEffect, useState, type FormEvent } from 'react'
import { NicknameField } from '../components/NicknameField'
import { useGuestNickname } from '../lib/guestProfile'
import { SongVoteControls } from '../components/SongVoteControls'
import {
  castSongVote,
  createSong,
  listSongs,
  sortSongsForBoard,
  subscribeToPlaylist,
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
  const [submittedBy, setSubmittedBy, persistNickname] = useGuestNickname()

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
      setError('Cola um endereço do Spotify ou do YouTube.')
      return
    }

    setSubmitting(true)
    try {
      await createSong({ url, submittedBy })
      await refreshSongs()
      persistNickname()
      setUrl('')
      setSuccess('Pronto! Sua música entra na festa.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra enviar a música.')
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
      setError(err instanceof Error ? err.message : 'Não deu pra registrar seu voto.')
    } finally {
      setVotingId(null)
    }
  }

  const visibleSongs = songs.filter((song) => !song.skipped)

  return (
    <section className="page">
      <header className="page-header">
        <h1>Manda uma música</h1>
        <p>
          Essa música vai tocar na festa, na caixa de som. Cola o endereço do Spotify ou do YouTube
          e a galera também pode dizer se gostou.
        </p>
      </header>

      <form className="panel form" onSubmit={onSubmit}>
        <label>
          Cola aqui o endereço do Spotify ou YouTube
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="cole aqui…"
            autoComplete="off"
          />
        </label>
        <p className="field-hint">No celular: compartilhar → copiar link</p>
        <NicknameField value={submittedBy} onChange={setSubmittedBy} />
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        {success ? <p className="form-msg form-msg-ok">{success}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={submitting || !isSupabaseConfigured}>
          {submitting ? 'Buscando a música…' : 'Enviar música'}
        </button>
      </form>

      <div className="panel list-panel">
        <h2>O que a galera mandou</h2>
        {loading ? <p className="muted">Carregando…</p> : null}
        {!loading && visibleSongs.length === 0 ? (
          <p className="muted">Nenhuma música ainda — manda a primeira.</p>
        ) : null}
        <ul className="song-list">
          {visibleSongs.map((song, index) => (
            <li
              key={song.id}
              className="song-item"
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
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
