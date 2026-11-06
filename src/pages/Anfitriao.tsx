import { useEffect, useRef, useState } from 'react'
import { GuestQr } from '../components/GuestQr'
import { HostGate } from '../components/HostGate'
import { LivePhotoWall } from '../components/LivePhotoWall'
import { PartyChatWall } from '../components/PartyChatWall'
import { PhotoModeration } from '../components/PhotoModeration'
import { RsvpSummary } from '../components/RsvpSummary'
import { copy } from '../lib/copy'
import {
  advancePlayQueue,
  buildPlayQueue,
  markCurrentPlaying,
  recoverPlayQueue,
  startPlayQueue,
  type PlayQueueState,
} from '../lib/playQueue'
import { extractYouTubeId } from '../lib/mediaIds'
import { resolvePlayableVideoId } from '../lib/resolvePlayable'
import {
  deleteSong,
  listSongs,
  moveSong,
  skipSong,
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

function youtubeThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export function Anfitriao() {
  return (
    <HostGate>
      <AnfitriaoHost />
    </HostGate>
  )
}

function AnfitriaoHost() {
  const [songs, setSongs] = useState<Song[]>([])
  const [playState, setPlayState] = useState<PlayQueueState>({
    playedIds: [],
    currentId: null,
  })
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [keepScreenOn, setKeepScreenOn] = useState(true)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [moderationBusyId, setModerationBusyId] = useState<string | null>(null)
  const [opsOpen, setOpsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const playerRef = useRef<YouTubePlayer | null>(null)
  const songsRef = useRef<Song[]>([])
  const playStateRef = useRef<PlayQueueState>(playState)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const keepScreenOnRef = useRef(true)
  const currentVideoIdRef = useRef<string | null>(null)
  const advancingRef = useRef(false)
  const bootstrappedRef = useRef(false)
  const skipStreakRef = useRef(0)

  async function requestWakeLock() {
    if (!keepScreenOnRef.current) return
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // unsupported / denied
    }
  }

  async function releaseWakeLock() {
    try {
      await wakeLockRef.current?.release()
    } catch {
      // already released
    }
    wakeLockRef.current = null
  }

  useEffect(() => {
    songsRef.current = songs
  }, [songs])

  useEffect(() => {
    playStateRef.current = playState
  }, [playState])

  useEffect(() => {
    keepScreenOnRef.current = keepScreenOn
    if (!keepScreenOn) {
      void releaseWakeLock()
      return
    }
    if (status === 'playing') {
      void requestWakeLock()
    }
  }, [keepScreenOn, status])

  const queueView = buildPlayQueue(songs, playState)
  const current = queueView.current
  const queueLength = queueView.ordered.length

  function applySongs(all: Song[], nextPlayState?: PlayQueueState) {
    setSongs(all)
    const base = nextPlayState ?? playStateRef.current
    const recovered = recoverPlayQueue(all, base)
    setPlayState(recovered)
    playStateRef.current = recovered
    return buildPlayQueue(all, recovered)
  }

  async function refreshSongs() {
    const data = await listSongs()
    return applySongs(data)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const loadState = { cancelled: false }

    void (async () => {
      try {
        const data = await listSongs()
        if (!loadState.cancelled) applySongs(data, startPlayQueue(data))
      } catch (err) {
        if (!loadState.cancelled) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar a playlist.')
        }
      } finally {
        if (!loadState.cancelled) setLoading(false)
      }
    })()

    const unsubscribe = subscribeToPlaylist(() => {
      void refreshSongs().catch(() => undefined)
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
      void releaseWakeLock()
    }
  }, [])

  function syncMediaSession(song: Song | undefined, playing: boolean, videoId?: string | null) {
    if (!('mediaSession' in navigator) || !song) return
    const artworkId = videoId ?? currentVideoIdRef.current
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'Fila da festa',
      artwork: artworkId
        ? [
            { src: youtubeThumb(artworkId), sizes: '480x360', type: 'image/jpeg' },
          ]
        : undefined,
    })
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }

  async function playCurrent({ autoplay }: { autoplay: boolean }) {
    const view = buildPlayQueue(songsRef.current, playStateRef.current)
    const song = view.current
    if (!song) return

    setStatus('loading')
    setError(null)

    try {
      const videoId = await resolvePlayableVideoId(song)
      currentVideoIdRef.current = videoId
      const upcoming = view.upcoming[0]
      if (upcoming) {
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
                const now = buildPlayQueue(songsRef.current, playStateRef.current).current
                syncMediaSession(now ?? undefined, true, currentVideoIdRef.current)
                void requestWakeLock()
              } else if (event.data === YT_PAUSED) {
                setStatus('paused')
                const now = buildPlayQueue(songsRef.current, playStateRef.current).current
                syncMediaSession(now ?? undefined, false, currentVideoIdRef.current)
                void releaseWakeLock()
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

      syncMediaSession(song, autoplay, videoId)
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
    if (buildPlayQueue(songsRef.current, playStateRef.current).ordered.length === 0) return

    if (options?.fromFailure) {
      skipStreakRef.current += 1
      const total = buildPlayQueue(songsRef.current, playStateRef.current).ordered.length
      if (skipStreakRef.current >= total) {
        setStatus('error')
        setError('Não consegui tocar nenhuma faixa da fila.')
        return
      }
    }

    advancingRef.current = true
    try {
      const next = advancePlayQueue(songsRef.current, playStateRef.current, delta)
      setPlayState(next)
      playStateRef.current = next
      await playCurrent({ autoplay: true })
    } finally {
      advancingRef.current = false
    }
  }

  useEffect(() => {
    if (!started || bootstrappedRef.current || queueLength === 0) return
    bootstrappedRef.current = true
    const startedState = startPlayQueue(songsRef.current)
    setPlayState(startedState)
    playStateRef.current = startedState
    void playCurrent({ autoplay: true })
    void requestWakeLock()
  }, [started, queueLength])

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

  async function handleSkipToggle(song: Song) {
    setVotingId(song.id)
    setError(null)
    try {
      const wasCurrent = song.id === playStateRef.current.currentId
      const data = song.skipped ? await unskipSong(song.id) : await skipSong(song.id)
      const view = applySongs(data)

      if (started && wasCurrent && !song.skipped) {
        if (!view.current) {
          setStatus('idle')
          setError('Fila vazia — todas as músicas foram tiradas da festa.')
          playerRef.current?.stopVideo()
        } else {
          await playCurrent({ autoplay: true })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra tirar a música.')
    } finally {
      setVotingId(null)
    }
  }

  async function skipCurrent() {
    if (!current) return
    await handleSkipToggle(current)
  }

  async function handleMove(songId: string, direction: 'up' | 'down') {
    setModerationBusyId(songId)
    setError(null)
    try {
      const data = await moveSong(songId, direction)
      applySongs(data)
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
      const wasCurrent = song.id === playStateRef.current.currentId
      const data = await deleteSong(song.id)
      const view = applySongs(data)

      if (started && wasCurrent) {
        if (!view.current) {
          setStatus('idle')
          setError('Fila vazia — não sobrou música.')
          playerRef.current?.stopVideo()
        } else {
          await playCurrent({ autoplay: true })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra remover a música.')
    } finally {
      setModerationBusyId(null)
    }
  }

  function jumpToSong(songId: string) {
    const next = markCurrentPlaying(playStateRef.current, songId)
    setPlayState(next)
    playStateRef.current = next
    if (started) {
      void playCurrent({ autoplay: true })
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

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== 'visible') return
      if (keepScreenOnRef.current && playerRef.current?.getPlayerState() === YT_PLAYING) {
        void requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  async function openCurrentOnYouTube() {
    if (!current) return
    const direct = extractYouTubeId(current.url)
    const videoId = direct ?? currentVideoIdRef.current ?? (await resolvePlayableVideoId(current).catch(() => null))
    if (!videoId) {
      setError('Não achei essa faixa no YouTube pra abrir no app.')
      return
    }
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer')
  }

  const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const upcoming = queueView.upcoming

  return (
    <section className="host-tv">
      <header className="host-tv-bar">
        <h1>{copy.hostTvTitle}</h1>
        <div className="host-tv-bar-end">
          <div className="host-tv-qrs">
            <GuestQr
              path="camera"
              size={88}
              className="guest-qr-bar"
              title={copy.hostQrCameraTitle}
              hint={copy.hostQrCameraHint}
              alt={copy.hostQrCameraAlt}
            />
            <GuestQr
              path="musicas"
              size={88}
              className="guest-qr-bar"
              title={copy.hostQrMusicTitle}
              hint={copy.hostQrMusicHint}
              alt={copy.hostQrMusicAlt}
            />
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setOpsOpen((open) => !open)}
          >
            {opsOpen ? copy.hostTvOpsClose : copy.hostTvOpsOpen}
          </button>
        </div>
      </header>

      <div className="host-tv-grid">
        <div className="host-tv-player panel player-panel">
          {!started ? (
            <div className="player-start">
              <p className="muted">
                {loading
                  ? 'Carregando a fila…'
                  : queueLength === 0
                    ? 'Nada na fila — a galera ainda não mandou música (ou tudo foi tirado).'
                    : `${queueLength} música(s) na fila.`}
              </p>
              <button
                className="btn btn-primary btn-lg"
                type="button"
                disabled={!isSupabaseConfigured || loading || queueLength === 0}
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
              </div>
            ) : null}

            {started ? (
              <div className="host-transport">
                <div className="player-controls host-transport-main">
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={queueLength < 2}
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
                    disabled={queueLength < 2}
                    onClick={() => {
                      void advance(1)
                    }}
                  >
                    Próxima
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    aria-expanded={moreOpen}
                    onClick={() => setMoreOpen((open) => !open)}
                  >
                    {moreOpen ? copy.hostMoreClose : copy.hostMore}
                  </button>
                </div>
                {moreOpen ? (
                  <div className="host-more-panel">
                    <label className="keep-screen-toggle">
                      <input
                        type="checkbox"
                        checked={keepScreenOn}
                        onChange={(event) => setKeepScreenOn(event.target.checked)}
                      />
                      <span>
                        Manter tela ligada
                        {!wakeLockSupported ? (
                          <span className="field-hint">Neste aparelho pode não funcionar.</span>
                        ) : null}
                      </span>
                    </label>
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
                    <button
                      className="btn btn-ghost"
                      type="button"
                      disabled={!current}
                      onClick={() => {
                        void openCurrentOnYouTube()
                      }}
                    >
                      Abrir no YouTube
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {started && status === 'loading' ? <p className="muted">Preparando a música…</p> : null}
            {error ? <p className="form-msg form-msg-error">{error}</p> : null}
          </div>

          <div className="host-upcoming">
            <h2>{copy.hostUpcomingTitle}</h2>
            {started && upcoming.length > 0 ? (
              <ol className="song-list play-queue host-upcoming-list">
                {upcoming.map((song, index) => {
                  const busy = moderationBusyId === song.id
                  return (
                    <li key={song.id} className="song-item host-upcoming-item">
                      <button
                        type="button"
                        className="queue-jump"
                        onClick={() => jumpToSong(song.id)}
                      >
                        <span className="queue-index">{index + 1}</span>
                        <span>
                          <strong>{song.title}</strong>
                          <span className="song-artist">{song.artist}</span>
                        </span>
                      </button>
                      <div className="host-upcoming-actions">
                        <button
                          type="button"
                          className="vote-btn"
                          disabled={busy || index === 0}
                          onClick={() => {
                            void handleMove(song.id, 'up')
                          }}
                        >
                          {copy.hostUpcomingUp}
                        </button>
                        <button
                          type="button"
                          className="vote-btn"
                          disabled={busy || index === upcoming.length - 1}
                          onClick={() => {
                            void handleMove(song.id, 'down')
                          }}
                        >
                          {copy.hostUpcomingDown}
                        </button>
                        <button
                          type="button"
                          className="vote-btn vote-btn-active-down"
                          disabled={busy}
                          onClick={() => {
                            void handleRemove(song)
                          }}
                        >
                          {copy.hostUpcomingRemove}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="muted">{copy.hostUpcomingEmpty}</p>
            )}
          </div>
        </div>

        <div className="host-tv-side">
          <PartyChatWall canModerate={opsOpen} />
          <LivePhotoWall canModerate={opsOpen} />
        </div>
      </div>

      {opsOpen ? (
        <div className="host-tv-ops panel">
          <RsvpSummary />
          <PhotoModeration />
        </div>
      ) : null}
    </section>
  )
}
