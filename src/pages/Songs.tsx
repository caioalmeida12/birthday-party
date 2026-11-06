import { useEffect, useState, type FormEvent } from 'react'
import { useGuestNickname } from '../components/GuestSession'
import { NicknameField } from '../components/NicknameField'
import { SongVoteControls } from '../components/SongVoteControls'
import {
  castSongVote,
  createSong,
  listSongs,
  sortSongsForBoard,
  subscribeToPlaylist,
  type Song,
} from '../lib/songs'
import { copy } from '../lib/copy'
import { classifySongInput } from '../lib/songSuggestion'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  searchYouTubeSongs,
  type SongSearchCandidate,
} from '../lib/youtubeSearch'

export function Songs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [submitting, setSubmitting] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<SongSearchCandidate[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
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

  function clearPick() {
    setCandidates([])
    setSelectedVideoId(null)
  }

  async function submitUrl(url: string) {
    await createSong({ url, submittedBy })
    await refreshSongs()
    persistNickname()
    setQuery('')
    clearPick()
    setSuccess(copy.songsOk)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSuccess(null)
    setError(null)

    const classified = classifySongInput(query)
    if (classified.kind === 'bad-url') {
      setError('Se for endereço, usa Spotify ou YouTube. Ou digita só o nome da música.')
      return
    }

    if (classified.kind === 'query' && !classified.query) {
      setError('Digita o nome da música ou cola o endereço.')
      return
    }

    setSubmitting(true)
    try {
      if (classified.kind === 'music-url') {
        await submitUrl(classified.url)
        return
      }

      const found = await searchYouTubeSongs(classified.query, 3)
      if (found.length === 0) {
        setError('Não achei essa música. Tenta outro nome ou cola o endereço.')
        clearPick()
        return
      }

      setCandidates(found)
      setSelectedVideoId(found[0].videoId)
      setSuccess(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra buscar a música.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmSelected() {
    const chosen = candidates.find((item) => item.videoId === selectedVideoId)
    if (!chosen) {
      setError('Escolhe uma das músicas achadas.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await submitUrl(chosen.url)
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
  const picking = candidates.length > 0

  return (
    <section className="page">
      <header className="page-header">
        <h1>{copy.songsTitle}</h1>
        <p>{copy.songsLead}</p>
      </header>

      <form className="panel form" onSubmit={onSubmit}>
        <label>
          {copy.songsField}
          <input
            required
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (candidates.length > 0) clearPick()
            }}
            placeholder={copy.songsFieldHint}
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        <NicknameField value={submittedBy} onChange={setSubmittedBy} />
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        {success ? <p className="form-msg form-msg-ok">{success}</p> : null}

        {!picking ? (
          <button className="btn btn-primary" type="submit" disabled={submitting || !isSupabaseConfigured}>
            {submitting ? copy.songsSearching : copy.songsSearch}
          </button>
        ) : null}
      </form>

      {picking ? (
        <div className="panel pick-panel">
          <h2>{copy.songsPickTitle}</h2>
          <p className="muted">{copy.songsPickLead}</p>
          <ul className="pick-list">
            {candidates.map((item) => {
              const selected = item.videoId === selectedVideoId
              return (
                <li key={item.videoId}>
                  <button
                    type="button"
                    className={`pick-option${selected ? ' pick-option-selected' : ''}`}
                    onClick={() => setSelectedVideoId(item.videoId)}
                    disabled={submitting}
                  >
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="pick-thumb" />
                    ) : (
                      <span className="pick-thumb pick-thumb-empty" aria-hidden />
                    )}
                    <span className="pick-meta">
                      <strong>{item.title}</strong>
                      <span>{item.artist}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="pick-actions">
            <button
              className="btn btn-primary"
              type="button"
              disabled={submitting || !selectedVideoId || !isSupabaseConfigured}
              onClick={() => {
                void confirmSelected()
              }}
            >
              {submitting ? copy.songsPickConfirming : copy.songsPickConfirm}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={submitting}
              onClick={() => {
                clearPick()
                setError(null)
              }}
            >
              {copy.songsPickAgain}
            </button>
          </div>
        </div>
      ) : null}

      <div className="panel list-panel">
        <h2>{copy.songsQueueTitle}</h2>
        <p className="queue-lead">{copy.songsQueueLead}</p>
        {loading ? <p className="muted">Carregando…</p> : null}
        {!loading && visibleSongs.length === 0 ? (
          <p className="muted">{copy.songsQueueEmpty}</p>
        ) : null}
        {!loading && visibleSongs.length > 0 ? (
          <p className="queue-count" aria-live="polite">
            {visibleSongs.length === 1
              ? copy.songsQueueOne
              : copy.songsQueueMany(visibleSongs.length)}
          </p>
        ) : null}
        <ol className="song-list song-queue">
          {visibleSongs.map((song, index) => (
            <li
              key={song.id}
              className="song-item"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span className="queue-pos" aria-label={`Posição ${index + 1}`}>
                {index + 1}
              </span>
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
        </ol>
      </div>
    </section>
  )
}
