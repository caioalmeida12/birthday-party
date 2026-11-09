import { useEffect, useRef, useState } from 'react'
import { copy } from '../lib/copy'
import {
  listLivePhotos,
  rejectPhoto,
  subscribeToLivePhotos,
  type Photo,
} from '../lib/photos'
import {
  nextPhotoStageSpeed,
  PHOTO_STAGE_SPEED_MS,
  photoStageWindow,
  shufflePhotoOrder,
  stepPhotoIndex,
  syncPhotoStageOrder,
  type PhotoStageSpeed,
} from '../lib/photoStageWindow'
import { isSupabaseConfigured } from '../lib/supabase'
import { PartyPhoto } from './PartyPhoto'

type Props = {
  canModerate?: boolean
}

export function LivePhotoStage({ canModerate = false }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [speed, setSpeed] = useState<PhotoStageSpeed>('normal')
  const [paused, setPaused] = useState(false)
  const [shuffled, setShuffled] = useState(false)

  const photosRef = useRef(photos)
  const indexRef = useRef(index)
  const shuffledRef = useRef(shuffled)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])
  useEffect(() => {
    indexRef.current = index
  }, [index])
  useEffect(() => {
    shuffledRef.current = shuffled
  }, [shuffled])

  function applyList(next: Photo[], currentId: string | null) {
    setPhotos(next)
    const at = currentId ? next.findIndex((photo) => photo.id === currentId) : 0
    setIndex(next.length === 0 ? 0 : at >= 0 ? at : 0)
  }

  async function refresh() {
    const data = await listLivePhotos()
    const previous = photosRef.current
    const currentId = previous[indexRef.current]?.id ?? null
    applyList(syncPhotoStageOrder(previous, data, shuffledRef.current), currentId)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false

    void (async () => {
      try {
        const data = await listLivePhotos()
        if (!cancelled) {
          setPhotos(data)
          setIndex(0)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar fotos ao vivo.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const unsubscribe = subscribeToLivePhotos(() => {
      void refresh().catch(() => undefined)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (paused || photos.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => stepPhotoIndex(current, photos.length, 1))
    }, PHOTO_STAGE_SPEED_MS[speed])
    return () => window.clearInterval(timer)
  }, [photos.length, speed, paused, index])

  async function onRemove(photo: Photo) {
    setBusyId(photo.id)
    setError(null)
    try {
      await rejectPhoto(photo)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra apagar.')
    } finally {
      setBusyId(null)
    }
  }

  function go(delta: number) {
    setIndex((current) => stepPhotoIndex(current, photos.length, delta))
  }

  function jumpTo(nextIndex: number) {
    setIndex(nextIndex)
  }

  async function toggleShuffle() {
    if (shuffled) {
      setShuffled(false)
      try {
        const data = await listLivePhotos()
        const currentId = photosRef.current[indexRef.current]?.id ?? null
        applyList(data, currentId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não deu pra restaurar a ordem.')
      }
      return
    }

    const currentId = photos[index]?.id ?? null
    const next = shufflePhotoOrder(photos, currentId)
    setPhotos(next)
    setIndex(0)
    setShuffled(true)
  }

  const empty = !loading && photos.length === 0
  const current = photos[index] ?? null
  const strip = photoStageWindow(photos, index, 3, 3)

  return (
    <div className={`host-photo-stage${empty ? ' host-photo-stage-empty' : ''}`}>
      {loading ? <p className="muted host-photo-stage-msg">Carregando…</p> : null}
      {empty ? (
        <div className="host-live-empty host-photo-stage-empty-body">
          <p>{copy.hostLiveEmpty}</p>
          <p className="host-live-empty-hint">{copy.hostLiveEmptyHint}</p>
        </div>
      ) : null}
      {error ? <p className="form-msg form-msg-error host-photo-stage-msg">{error}</p> : null}
      {current ? (
        <>
          <figure className="host-photo-slide">
            <div className="host-photo-media">
              <PartyPhoto
                key={current.id}
                src={current.publicUrl}
                alt={current.submitted_by || 'Foto ao vivo'}
              />
            </div>
            <figcaption>
              <span>{current.submitted_by || copy.photoModAnonymous}</span>
              <span className="host-photo-count">
                {index + 1}/{photos.length}
                {shuffled ? ` · ${copy.hostPhotoShuffle}` : ''}
              </span>
              {canModerate ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-tiny"
                  disabled={busyId === current.id}
                  onClick={() => {
                    void onRemove(current)
                  }}
                >
                  {copy.hostLiveRemove}
                </button>
              ) : null}
            </figcaption>
          </figure>

          <div className="host-photo-controls">
            <button
              type="button"
              className="btn btn-ghost host-photo-ctrl"
              disabled={photos.length < 2}
              onClick={() => go(-1)}
              aria-label={copy.hostPhotoPrev}
            >
              <i className="fa-solid fa-backward-step" aria-hidden="true" />
              <span>{copy.hostPhotoPrev}</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost host-photo-ctrl"
              disabled={photos.length < 2}
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? copy.hostPhotoPlay : copy.hostPhotoPause}
            >
              <i
                className={`fa-solid ${paused ? 'fa-play' : 'fa-pause'}`}
                aria-hidden="true"
              />
              <span>{paused ? copy.hostPhotoPlay : copy.hostPhotoPause}</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost host-photo-ctrl"
              disabled={photos.length < 2}
              onClick={() => go(1)}
              aria-label={copy.hostPhotoNext}
            >
              <i className="fa-solid fa-forward-step" aria-hidden="true" />
              <span>{copy.hostPhotoNext}</span>
            </button>
            <button
              type="button"
              className={`btn btn-ghost host-photo-ctrl${shuffled ? ' host-photo-ctrl-active' : ''}`}
              disabled={photos.length < 2}
              onClick={() => {
                void toggleShuffle()
              }}
              aria-pressed={shuffled}
              aria-label={shuffled ? copy.hostPhotoShuffleOn : copy.hostPhotoShuffleOff}
            >
              <i className="fa-solid fa-shuffle" aria-hidden="true" />
              <span>{copy.hostPhotoShuffle}</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost host-photo-ctrl host-photo-speed"
              disabled={photos.length < 2}
              onClick={() => setSpeed((currentSpeed) => nextPhotoStageSpeed(currentSpeed))}
              aria-label={copy.hostPhotoSpeed}
            >
              <i className="fa-solid fa-gauge-high" aria-hidden="true" />
              <span>{copy.hostPhotoSpeedLabel(speed)}</span>
            </button>
          </div>

          {strip.length > 1 ? (
            <div className="host-photo-strip" role="list" aria-label={copy.hostPhotoStrip}>
              {strip.map((entry, stripIndex) => {
                const active = entry.role === 'current'
                return (
                  <button
                    key={`${entry.index}-${entry.role}-${stripIndex}`}
                    type="button"
                    role="listitem"
                    className={`host-photo-thumb host-photo-thumb-${entry.role}`}
                    aria-current={active ? 'true' : undefined}
                    aria-label={
                      active
                        ? copy.hostPhotoThumbCurrent
                        : copy.hostPhotoThumbJump(entry.index + 1)
                    }
                    onClick={() => jumpTo(entry.index)}
                  >
                    <PartyPhoto
                      src={entry.item.publicUrl}
                      alt=""
                      className="host-photo-thumb-img"
                    />
                  </button>
                )
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
