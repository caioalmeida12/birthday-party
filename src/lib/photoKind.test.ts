import { describe, expect, it } from 'vitest'
import { isDecorPhoto, isLivePhoto, parsePhotoKind } from './photoKind'

describe('parsePhotoKind', () => {
  it('trata ausente como decor', () => {
    expect(parsePhotoKind(undefined)).toBe('decor')
    expect(parsePhotoKind(null)).toBe('decor')
    expect(parsePhotoKind('outro')).toBe('decor')
  })

  it('reconhece live', () => {
    expect(parsePhotoKind('live')).toBe('live')
  })
})

describe('kind helpers', () => {
  it('separa decor e live', () => {
    expect(isDecorPhoto('decor')).toBe(true)
    expect(isLivePhoto('live')).toBe(true)
    expect(isDecorPhoto('live')).toBe(false)
  })
})
