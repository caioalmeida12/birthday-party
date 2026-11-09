import { describe, expect, it } from 'vitest'
import {
  nextPhotoStageSpeed,
  photoStageWindow,
  PHOTO_STAGE_SPEED_MS,
  shufflePhotoOrder,
  stepPhotoIndex,
  syncPhotoStageOrder,
  wrapPhotoIndex,
} from './photoStageWindow'

describe('photoStageWindow', () => {
  const photos = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

  it('mostra últimas, atual e próximas ao redor do índice', () => {
    const window = photoStageWindow(photos, 3, 2, 2)
    expect(window.map((entry) => `${entry.role}:${entry.item}`)).toEqual([
      'past:b',
      'past:c',
      'current:d',
      'next:e',
      'next:f',
    ])
  })

  it('dá a volta no anel nas bordas', () => {
    const window = photoStageWindow(photos, 0, 2, 2)
    expect(window.map((entry) => entry.item)).toEqual(['f', 'g', 'a', 'b', 'c'])
    expect(window.find((entry) => entry.role === 'current')?.item).toBe('a')
  })

  it('mantém a janela mesmo em lista curta', () => {
    const window = photoStageWindow(['x', 'y'], 0, 1, 1)
    expect(window.map((entry) => `${entry.role}:${entry.item}`)).toEqual([
      'past:y',
      'current:x',
      'next:y',
    ])
  })
})

describe('stepPhotoIndex', () => {
  it('avança e volta no anel', () => {
    expect(stepPhotoIndex(0, 5, 1)).toBe(1)
    expect(stepPhotoIndex(4, 5, 1)).toBe(0)
    expect(stepPhotoIndex(0, 5, -1)).toBe(4)
    expect(wrapPhotoIndex(-1, 5)).toBe(4)
  })
})

describe('photo stage speed', () => {
  it('cicla lento → normal → rápido', () => {
    expect(nextPhotoStageSpeed('slow')).toBe('normal')
    expect(nextPhotoStageSpeed('normal')).toBe('fast')
    expect(nextPhotoStageSpeed('fast')).toBe('slow')
    expect(PHOTO_STAGE_SPEED_MS.fast).toBeLessThan(PHOTO_STAGE_SPEED_MS.normal)
  })
})

describe('shufflePhotoOrder', () => {
  const items = [
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
    { id: 'd' },
  ]

  it('embaralha com o gerador dado e mantém a atual na frente', () => {
    let calls = 0
    const sequence = [0, 0, 0]
    const random = () => sequence[calls++] ?? 0
    const shuffled = shufflePhotoOrder(items, 'c', random)
    expect(shuffled[0]?.id).toBe('c')
    expect(shuffled.map((item) => item.id).sort()).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('syncPhotoStageOrder', () => {
  it('com shuffle off devolve a lista do servidor', () => {
    const prev = [{ id: 'b' }, { id: 'a' }]
    const next = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(syncPhotoStageOrder(prev, next, false)).toEqual(next)
  })

  it('com shuffle on preserva ordem e anexa novas', () => {
    const prev = [{ id: 'b' }, { id: 'a' }]
    const next = [
      { id: 'a', n: 1 },
      { id: 'b', n: 2 },
      { id: 'c', n: 3 },
    ]
    expect(syncPhotoStageOrder(prev, next, true).map((item) => item.id)).toEqual([
      'b',
      'a',
      'c',
    ])
  })
})
