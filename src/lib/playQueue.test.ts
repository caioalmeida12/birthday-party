import { describe, expect, it } from 'vitest'
import {
  advancePlayQueue,
  buildPlayQueue,
  markCurrentPlaying,
  recoverPlayQueue,
  startPlayQueue,
  type PlayQueueState,
} from './playQueue'
import type { Song } from './songs'

function song(
  partial: Pick<Song, 'id' | 'title' | 'position' | 'score'> & Partial<Song>,
): Song {
  return {
    artist: 'Artista',
    url: `https://open.spotify.com/track/${partial.id}`,
    submitted_by: null,
    created_at: `2026-01-0${partial.position}T12:00:00.000Z`,
    upvotes: Math.max(partial.score, 0),
    downvotes: Math.max(-partial.score, 0),
    skipped: false,
    myVote: 0,
    ...partial,
  }
}

describe('playQueue playhead', () => {
  const A = song({ id: 'a', title: 'Um', position: 1, score: 0 })
  const B = song({ id: 'b', title: 'Dois', position: 2, score: 0 })
  const C = song({ id: 'c', title: 'Três', position: 3, score: 0 })

  it('começa pela primeira da ordem', () => {
    const state = startPlayQueue([C, A, B])
    const view = buildPlayQueue([A, B, C], state)
    expect(view.current?.id).toBe('a')
    expect(view.upcoming.map((s) => s.id)).toEqual(['b', 'c'])
    expect(view.played).toEqual([])
  })

  it('upvote que sobe a 3ª não enterra a 1ª que ainda não tocou', () => {
    // Fila mental: 1=A, 2=B (tocando), 3=C. C leva upvote e vira posição 1.
    const hotC = song({ id: 'c', title: 'Três', position: 1, score: 99 })
    const midA = song({ id: 'a', title: 'Um', position: 2, score: 0 })
    const midB = song({ id: 'b', title: 'Dois', position: 3, score: 0 })

    const state = { playedIds: [] as string[], currentId: 'b' }
    const view = buildPlayQueue([hotC, midA, midB], state)

    expect(view.current?.id).toBe('b')
    // C sobe no upcoming, A continua — vai tocar depois.
    expect(view.upcoming.map((s) => s.id)).toEqual(['c', 'a'])
  })

  it('garante que a antiga 1ª toca depois da atual e da que subiu', () => {
    const hotC = song({ id: 'c', title: 'Três', position: 1, score: 99 })
    const midA = song({ id: 'a', title: 'Um', position: 2, score: 0 })
    const midB = song({ id: 'b', title: 'Dois', position: 3, score: 0 })
    const songs = [hotC, midA, midB]

    let state: PlayQueueState = { playedIds: [], currentId: 'b' }
    state = advancePlayQueue(songs, state, 1)
    expect(state.currentId).toBe('c')
    expect(state.playedIds).toEqual(['b'])

    state = advancePlayQueue(songs, state, 1)
    expect(state.currentId).toBe('a')
    expect(state.playedIds).toEqual(['b', 'c'])
  })

  it('faixa já tocada não volta ao upcoming só porque levou upvote', () => {
    const hotA = song({ id: 'a', title: 'Um', position: 1, score: 50 })
    const B2 = song({ id: 'b', title: 'Dois', position: 2, score: 0 })
    const C2 = song({ id: 'c', title: 'Três', position: 3, score: 0 })

    const view = buildPlayQueue([hotA, B2, C2], {
      playedIds: ['a'],
      currentId: 'b',
    })

    expect(view.current?.id).toBe('b')
    expect(view.upcoming.map((s) => s.id)).toEqual(['c'])
    expect(view.played.map((s) => s.id)).toEqual(['a'])
  })

  it('ao acabar a rodada, recomeça sem perder faixas', () => {
    const songs = [A, B, C]
    let state: PlayQueueState = { playedIds: ['a', 'b'], currentId: 'c' }
    state = advancePlayQueue(songs, state, 1)
    expect(state.playedIds).toEqual([])
    expect(state.currentId).toBe('a')

    const view = buildPlayQueue(songs, state)
    expect(view.upcoming.map((s) => s.id)).toEqual(['b', 'c'])
  })

  it('skip/delete da atual recupera a próxima do upcoming', () => {
    const state = recoverPlayQueue([A, B, C], {
      playedIds: ['a'],
      currentId: 'gone',
    })
    expect(state.currentId).toBe('b')
  })

  it('pulo manual do host não marca as faixas do meio como tocadas', () => {
    const state = markCurrentPlaying({ playedIds: ['a'], currentId: 'b' }, 'c')
    const view = buildPlayQueue([A, B, C], state)
    expect(view.current?.id).toBe('c')
    expect(view.played.map((s) => s.id)).toEqual(['a'])
    expect(view.upcoming.map((s) => s.id)).toEqual(['b'])
  })

  it('voltar restaura a faixa anterior', () => {
    const songs = [A, B, C]
    let state: PlayQueueState = { playedIds: ['a'], currentId: 'b' }
    state = advancePlayQueue(songs, state, -1)
    expect(state.currentId).toBe('a')
    expect(state.playedIds).toEqual([])
  })

  it('ignora skipped no upcoming', () => {
    const skippedB = song({ id: 'b', title: 'Dois', position: 2, score: 0, skipped: true })
    const view = buildPlayQueue([A, skippedB, C], startPlayQueue([A, skippedB, C]))
    expect(view.current?.id).toBe('a')
    expect(view.upcoming.map((s) => s.id)).toEqual(['c'])
  })
})
