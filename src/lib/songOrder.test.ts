import { describe, expect, it } from 'vitest'
import { sortSongsForBoard, sortSongsForQueue, type OrderableSong } from './songOrder'

function song(
  partial: Partial<OrderableSong> & Pick<OrderableSong, 'id' | 'score' | 'position'>,
): OrderableSong {
  return {
    created_at: partial.created_at ?? `2026-01-0${partial.position}T00:00:00Z`,
    skipped: partial.skipped ?? false,
    ...partial,
  }
}

describe('sortSongsForBoard', () => {
  it('coloca as mais curtidas (score) na frente, independente da posição', () => {
    const ordered = sortSongsForBoard([
      song({ id: 'a', position: 1, score: 0 }),
      song({ id: 'b', position: 2, score: 5 }),
      song({ id: 'c', position: 3, score: 2 }),
    ])
    expect(ordered.map((item) => item.id)).toEqual(['b', 'c', 'a'])
  })

  it('mantém skipped no fim', () => {
    const ordered = sortSongsForBoard([
      song({ id: 'skip', position: 1, score: 99, skipped: true }),
      song({ id: 'ok', position: 2, score: 1 }),
    ])
    expect(ordered.map((item) => item.id)).toEqual(['ok', 'skip'])
  })
})

describe('sortSongsForQueue', () => {
  it('prioriza score na TV, igual ao board do convidado', () => {
    const songs = [
      song({ id: 'a', position: 1, score: 0 }),
      song({ id: 'b', position: 2, score: 5 }),
      song({ id: 'c', position: 3, score: 2 }),
    ]
    const queue = sortSongsForQueue(songs).map((item) => item.id)
    const board = sortSongsForBoard(songs).map((item) => item.id)
    expect(queue).toEqual(['b', 'c', 'a'])
    expect(queue).toEqual(board)
  })
})
