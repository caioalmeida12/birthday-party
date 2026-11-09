import type { Song } from './songs'
import { sortSongsForQueue } from './songOrder'

export type PlayQueueState = {
  /** Faixas já tocadas nesta rodada (não voltam por upvote). */
  playedIds: string[]
  /** Faixa tocando agora. */
  currentId: string | null
}

export type PlayQueueView = {
  played: Song[]
  current: Song | null
  upcoming: Song[]
  /** Ordem efetiva: played + current + upcoming */
  ordered: Song[]
}

function songMap(songs: Song[]): Map<string, Song> {
  return new Map(songs.map((song) => [song.id, song]))
}

/** Candidatas a tocar: não skipped. */
export function eligibleSongs(songs: Song[]): Song[] {
  return songs.filter((song) => !song.skipped)
}

/**
 * Monta a fila com playhead:
 * - played: já tocaram nesta rodada (ordem em que tocaram)
 * - current: está tocando (fixa, mesmo se a ordem global mudar)
 * - upcoming: o resto, reordenado por score (igual /musicas)
 *
 * Upvote / reordenação só mexem em `upcoming`. Ninguém “pula” o playhead
 * e some sem tocar.
 */
export function buildPlayQueue(songs: Song[], state: PlayQueueState): PlayQueueView {
  const byId = songMap(eligibleSongs(songs))
  const played: Song[] = []
  const seen = new Set<string>()

  for (const id of state.playedIds) {
    const song = byId.get(id)
    if (!song || seen.has(id)) continue
    played.push(song)
    seen.add(id)
  }

  let current: Song | null = null
  if (state.currentId && byId.has(state.currentId) && !seen.has(state.currentId)) {
    current = byId.get(state.currentId) ?? null
    if (current) seen.add(current.id)
  }

  const upcoming = sortSongsForQueue(
    [...byId.values()].filter((song) => !seen.has(song.id)),
  )

  // Sem current: puxa a próxima do upcoming.
  if (!current && upcoming.length > 0) {
    current = upcoming.shift() ?? null
  }

  const ordered = [...played, ...(current ? [current] : []), ...upcoming]
  return { played, current, upcoming, ordered }
}

export function startPlayQueue(songs: Song[]): PlayQueueState {
  const first = sortSongsForQueue(eligibleSongs(songs))[0]
  return {
    playedIds: [],
    currentId: first?.id ?? null,
  }
}

/**
 * Avança o playhead. Se a rodada acabou, inicia outra com todas as elegíveis
 * (as que nunca tocaram nesta rodada já estavam no upcoming — não se perdem).
 */
export function advancePlayQueue(
  songs: Song[],
  state: PlayQueueState,
  delta = 1,
): PlayQueueState {
  if (delta === 0) return state

  let view = buildPlayQueue(songs, state)
  let playedIds = [...state.playedIds]
  let currentId = view.current?.id ?? null

  const steps = Math.abs(delta)
  const forward = delta > 0

  for (let step = 0; step < steps; step += 1) {
    view = buildPlayQueue(songs, { playedIds, currentId })

    if (forward) {
      if (view.current) {
        playedIds = [...playedIds, view.current.id]
      }

      if (view.upcoming.length > 0) {
        currentId = view.upcoming[0].id
        continue
      }

      // Nova rodada: limpa histórico e recomeça pela ordem atual.
      const restart = startPlayQueue(songs)
      playedIds = []
      currentId = restart.currentId
      continue
    }

    // Voltar: tira a atual do “agora” e recupera a última played.
    if (playedIds.length === 0) {
      continue
    }
    const previousId = playedIds[playedIds.length - 1]
    playedIds = playedIds.slice(0, -1)
    currentId = previousId
  }

  return { playedIds, currentId }
}

/** Quando a faixa atual some (delete/skip), escolhe a próxima sem marcar played. */
export function recoverPlayQueue(songs: Song[], state: PlayQueueState): PlayQueueState {
  const view = buildPlayQueue(songs, state)
  if (view.current) {
    return { playedIds: state.playedIds, currentId: view.current.id }
  }
  return startPlayQueue(songs)
}

export function markCurrentPlaying(state: PlayQueueState, songId: string): PlayQueueState {
  if (state.currentId === songId) return state
  // Host saltou pra uma faixa: o que estava na frente e não tocou
  // permanece no upcoming (não entra em played).
  return {
    playedIds: state.playedIds.filter((id) => id !== songId),
    currentId: songId,
  }
}
