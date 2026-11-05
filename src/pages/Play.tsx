import { useEffect, useRef, useState } from 'react'
import { resolvePlayableVideoId } from '../lib/resolvePlayable'
import { listSongs, type Song } from '../lib/songs'
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
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)

  const playerRef = useRef<YouTubePlayer | null>(null)
  const indexRef = useRef(0)
  const songsRef = useRef<Song[]>([])
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const advancingRef = useRef(false)
  const bootstrappedRef = useRef(false)
  const skipStreakRef = useRef(0)

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    songsRef.current = songs
  }, [songs])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false
    void (async () => {
      try {
        const data = await listSongs({ ascending: true })
        if (!cancelled) setSongs(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar a playlist.')
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
    const queue = songsRef.current
    if (queue.length === 0) return

    const safeIndex = ((nextIndex % queue.length) + queue.length) % queue.length
    const song = queue[safeIndex]
    setIndex(safeIndex)
    setStatus('loading')
    setError(null)

    try {
      const videoId = await resolvePlayableVideoId(song)
      const upcoming = queue[(safeIndex + 1) % queue.length]
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
                syncMediaSession(songsRef.current[indexRef.current], true)
                void requestWakeLock()
              } else if (event.data === YT_PAUSED) {
                setStatus('paused')
                syncMediaSession(songsRef.current[indexRef.current], false)
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
    if (songsRef.current.length === 0) return

    if (options?.fromFailure) {
      skipStreakRef.current += 1
      if (skipStreakRef.current >= songsRef.current.length) {
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
    if (!started || bootstrappedRef.current || songs.length === 0) return
    bootstrappedRef.current = true
    void playSongAt(0, { autoplay: true })
    void requestWakeLock()
  }, [started, songs.length])

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

  const current = songs[index]

  return (
    <section className="page play-page">
      <header className="page-header">
        <h1>Tocar na festa</h1>
        <p>
          Deixa o celular ligado na caixa via Bluetooth. A playlist toca aqui dentro, em sequência.
        </p>
      </header>

      <div className="panel player-panel">
        {!started ? (
          <div className="player-start">
            <p className="muted">
              {loading
                ? 'Carregando playlist…'
                : songs.length === 0
                  ? 'Ainda não tem música na fila.'
                  : `${songs.length} música(s) na fila.`}
            </p>
            <button
              className="btn btn-primary btn-lg"
              type="button"
              disabled={!isSupabaseConfigured || loading || songs.length === 0}
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
            <div className="player-controls">
              <button
                className="btn btn-ghost"
                type="button"
                disabled={songs.length < 2}
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
                disabled={songs.length < 2}
                onClick={() => {
                  void advance(1)
                }}
              >
                Próxima
              </button>
            </div>
          ) : null}

          {started && status === 'loading' ? <p className="muted">Preparando faixa…</p> : null}
          {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        </div>
      </div>

      <div className="panel list-panel">
        <h2>Fila</h2>
        {loading ? <p className="muted">Carregando…</p> : null}
        {!loading && songs.length === 0 ? (
          <p className="muted">Nenhuma música ainda — peça pra galera mandar links.</p>
        ) : null}
        <ol className="song-list play-queue">
          {songs.map((song, songIndex) => (
            <li
              key={song.id}
              className={
                started && songIndex === index ? 'song-item song-item-active' : 'song-item'
              }
            >
              <button
                type="button"
                className="queue-jump"
                disabled={!started}
                onClick={() => {
                  void playSongAt(songIndex, { autoplay: true })
                }}
              >
                <span className="queue-index">{songIndex + 1}</span>
                <span>
                  <strong>{song.title}</strong>
                  <span className="song-artist">{song.artist}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
