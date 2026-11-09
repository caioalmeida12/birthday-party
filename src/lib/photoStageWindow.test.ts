import { describe, expect, it } from 'vitest'
import {
  nextPhotoStageSpeed,
  photoStageWindow,
  PHOTO_STAGE_SPEED_MS,
  stepPhotoIndex,
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
