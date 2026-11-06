import { useEffect, useRef, useState } from 'react'
import { ModerateQueue } from '../components/ModerateQueue'
import { SongVoteControls } from '../components/SongVoteControls'
import { resolvePlayableVideoId } from '../lib/resolvePlayable'
import {
  castSongVote,
  deleteSong,
  listSongs,
  moveSong,
  skipSong,
  sortSongsForModeration,
  sortSongsForQueue,
  subscribeToPlaylist,
  unskipSong,
  type Song,
} from '../lib/songs'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  loadYouTubeApi,
  YT_ENDED,
  YT_PAUSED,
  YT_PLAYING,
  type YouTubePlayer,
} from '../lib/youtubeApi'

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export function Play() {
  const [songs, setSongs] = useState<Song[]>([])
  const [queue, setQueue] = useState<Song[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [moderationBusyId, setModerationBusyId] = useState<string | null>(null)

  const playerRef = useRef<YouTubePlayer | null>(null)
  const indexRef = useRef(0)
  const queueRef = useRef<Song[]>([])
  const currentIdRef = useRef<string | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const advancingRef = useRef(false)
  const bootstrappedRef = useRef(false)
  const skipStreakRef = useRef(0)

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  function applySongs(all: Song[], { preferSongId }: { preferSongId?: string | null } = {}) {
    setSongs(all)
    const nextQueue = sortSongsForQueue(all)
    setQueue(nextQueue)

    const preferredId = preferSongId ?? currentIdRef.current
    if (!preferredId || nextQueue.length === 0) {
      setIndex(0)
      currentIdRef.current = nextQueue[0]?.id ?? null
      return nextQueue
    }

    const found = nextQueue.findIndex((song) => song.id === preferredId)
    if (found >= 0) {
      setIndex(found)
      currentIdRef.current = preferredId
    } else {
      setIndex(0)
      currentIdRef.current = nextQueue[0]?.id ?? null
    }
    return nextQueue
  }

  async function refreshSongs(preferSongId?: string | null) {
    const data = await listSongs()
    return applySongs(data, { preferSongId })
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const loadState = { cancelled: false }

    void (async () => {
      try {
        const data = await listSongs()
        if (!loadState.cancelled) applySongs(data)
      } catch (err) {
        if (!loadState.cancelled) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar a playlist.')
        }
      } finally {
        if (!loadState.cancelled) setLoading(false)
      }
    })()

    const unsubscribe = subscribeToPlaylist(() => {
      void refreshSongs(currentIdRef.current).catch(() => undefined)
    })

    return () => {
      loadState.cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
      void wakeLockRef.current?.release()
      wakeLockRef.current = null
    }
  }, [])

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // unsupported / denied
    }
  }

  function syncMediaSession(song: Song | undefined, playing: boolean) {
    if (!('mediaSession' in navigator) || !song) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'Playlist da festa',
    })
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }

  async function playSongAt(nextIndex: number, { autoplay }: { autoplay: boolean }) {
    const currentQueue = queueRef.current
    if (currentQueue.length === 0) return

    const safeIndex = ((nextIndex % currentQueue.length) + currentQueue.length) % currentQueue.length
    const song = currentQueue[safeIndex]
    setIndex(safeIndex)
    currentIdRef.current = song.id
    setStatus('loading')
    setError(null)

    try {
      const videoId = await resolvePlayableVideoId(song)
      const upcoming = currentQueue[(safeIndex + 1) % currentQueue.length]
      if (upcoming && upcoming.id !== song.id) {
        void resolvePlayableVideoId(upcoming).catch(() => undefined)
      }

      const YT = await loadYouTubeApi()

      if (!playerRef.current) {
        playerRef.current = new YT.Player('party-youtube-player', {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (autoplay) event.target.playVideo()
            },
            onStateChange: (event) => {
              if (event.data === YT_ENDED) {
                skipStreakRef.current = 0
                void advance(1)
              } else if (event.data === YT_PLAYING) {
                skipStreakRef.current = 0
                setStatus('playing')
                syncMediaSession(queueRef.current[indexRef.current], true)
                void requestWakeLock()
              } else if (event.data === YT_PAUSED) {
                setStatus('paused')
                syncMediaSession(queueRef.current[indexRef.current], false)
              }
            },
            onError: () => {
              setError('Essa faixa falhou no YouTube — pulando…')
              window.setTimeout(() => {
                void advance(1, { fromFailure: true })
              }, 600)
            },
          },
        })
      } else if (autoplay) {
        playerRef.current.loadVideoById(videoId)
      } else {
        playerRef.current.cueVideoById(videoId)
      }

      syncMediaSession(song, autoplay)
      if (!autoplay) setStatus('paused')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Falha ao preparar a faixa.')
      window.setTimeout(() => {
        void advance(1, { fromFailure: true })
      }, 900)
    }
  }

  async function advance(delta: number, options?: { fromFailure?: boolean }) {
    if (advancingRef.current) return
    if (queueRef.current.length === 0) return

    if (options?.fromFailure) {
      skipStreakRef.current += 1
      if (skipStreakRef.current >= queueRef.current.length) {
        setStatus('error')
        setError('Não consegui tocar nenhuma faixa da fila.')
        return
      }
    }

    advancingRef.current = true
    try {
      await playSongAt(indexRef.current + delta, { autoplay: true })
    } finally {
      advancingRef.current = false
    }
  }

  useEffect(() => {
    if (!started || bootstrappedRef.current || queue.length === 0) return
    bootstrappedRef.current = true
    void playSongAt(0, { autoplay: true })
    void requestWakeLock()
  }, [started, queue.length])

  function togglePlayPause() {
    const player = playerRef.current
    if (!player) {
      setStarted(true)
      return
    }
    if (player.getPlayerState() === YT_PLAYING) {
      player.pauseVideo()
    } else {
      player.playVideo()
    }
  }

  async function handleVote(songId: string, vote: 1 | -1) {
    setVotingId(songId)
    setError(null)
    try {
      const data = await castSongVote(songId, vote)
      applySongs(data, { preferSongId: currentIdRef.current })
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
      const wasCurrent = song.id === currentIdRef.current
      const data = song.skipped ? await unskipSong(song.id) : await skipSong(song.id)
      const nextQueue = applySongs(data, {
        preferSongId: wasCurrent && !song.skipped ? null : currentIdRef.current,
      })

      if (started && wasCurrent && !song.skipped) {
        if (nextQueue.length === 0) {
          setStatus('idle')
          setError('Fila vazia — todas as músicas foram tiradas da festa.')
          playerRef.current?.stopVideo()
        } else {
          await playSongAt(0, { autoplay: true })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra tirar a música.')
    } finally {
      setVotingId(null)
    }
  }

  async function skipCurrent() {
    const current = queueRef.current[indexRef.current]
    if (!current) return
    await handleSkipToggle(current)
  }

  async function handleMove(songId: string, direction: 'up' | 'down') {
    setModerationBusyId(songId)
    setError(null)
    try {
      const data = await moveSong(songId, direction)
      applySongs(data, { preferSongId: currentIdRef.current })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra mudar a ordem.')
    } finally {
      setModerationBusyId(null)
    }
  }

  async function handleRemove(song: Song) {
    const confirmed = window.confirm(
      `Remover de vez “${song.title}”? Ela some da festa e não volta.`,
    )
    if (!confirmed) return

    setModerationBusyId(song.id)
    setError(null)
    try {
      const wasCurrent = song.id === currentIdRef.current
      const data = await deleteSong(song.id)
      const nextQueue = applySongs(data, {
        preferSongId: wasCurrent ? null : currentIdRef.current,
      })

      if (started && wasCurrent) {
        if (nextQueue.length === 0) {
          setStatus('idle')
          setError('Fila vazia — não sobrou música.')
          playerRef.current?.stopVideo()
        } else {
          await playSongAt(0, { autoplay: true })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra remover a música.')
    } finally {
      setModerationBusyId(null)
    }
  }

  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.setActionHandler('play', () => {
      playerRef.current?.playVideo()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      playerRef.current?.pauseVideo()
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      void advance(1)
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      void advance(-1)
    })

    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
    }
  }, [])

  const current = queue[index]
  const moderationList = sortSongsForModeration(songs)

  return (
    <section className="page play-page">
      <header className="page-header">
        <h1>Tocar na festa</h1>
        <p>
          Liga o celular na caixa. Aqui você sobe, desce ou remove músicas ao vivo. “Tirar da festa”
          só tira da rotação; “Remover” apaga de vez.
        </p>
      </header>

      <div className="panel player-panel">
        {!started ? (
          <div className="player-start">
            <p className="muted">
              {loading
                ? 'Carregando a fila…'
                : queue.length === 0
                  ? 'Nada na fila — a galera ainda não mandou música (ou tudo foi tirado).'
                  : `${queue.length} música(s) na fila.`}
            </p>
            <button
              className="btn btn-primary btn-lg"
              type="button"
              disabled={!isSupabaseConfigured || loading || queue.length === 0}
              onClick={() => setStarted(true)}
            >
              Começar a tocar
            </button>
          </div>
        ) : null}

        <div className={started ? 'player-stage' : 'player-stage player-stage-pending'}>
          <div className="player-frame">
            <div id="party-youtube-player" />
          </div>

          {started && current ? (
            <div className="now-playing">
              <p className="now-playing-label">Agora</p>
              <h2>{current.title}</h2>
              <p className="song-artist">{current.artist}</p>
              {current.submitted_by ? (
                <p className="song-by">sugerida por {current.submitted_by}</p>
              ) : null}
              <SongVoteControls
                song={current}
                showSkip
                disabled={votingId === current.id}
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
            </div>
          ) : null}

          {started ? (
            <div className="player-controls">
              <button
                className="btn btn-ghost"
                type="button"
                disabled={queue.length < 2}
                onClick={() => {
                  void advance(-1)
                }}
              >
                Anterior
              </button>
              <button className="btn btn-primary" type="button" onClick={togglePlayPause}>
                {status === 'playing' ? 'Pausar' : 'Tocar'}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={queue.length < 2}
                onClick={() => {
                  void advance(1)
                }}
              >
                Próxima
              </button>
              <button
                className="btn btn-ghost btn-danger-ghost"
                type="button"
                disabled={!current || votingId === current.id}
                onClick={() => {
                  void skipCurrent()
                }}
              >
                Tirar da festa
              </button>
            </div>
          ) : null}

          {started && status === 'loading' ? <p className="muted">Preparando a música…</p> : null}
          {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        </div>
      </div>

      <div className="panel list-panel">
        <h2>Moderar fila</h2>
        <p className="muted moderate-help">
          Subir / Descer muda a ordem na hora. Remover apaga a música pra sempre.
        </p>
        {loading ? <p className="muted">Carregando…</p> : null}
        {!loading ? (
          <ModerateQueue
            songs={moderationList}
            busyId={moderationBusyId}
            onMove={(songId, direction) => {
              void handleMove(songId, direction)
            }}
            onRemove={(song) => {
              void handleRemove(song)
            }}
          />
        ) : null}
      </div>
    </section>
  )
}
