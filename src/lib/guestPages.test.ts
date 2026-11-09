import { describe, expect, it } from 'vitest'
import { guestHopNeighbors, guestNavItems, isGuestHopPath } from './guestPages'

describe('guestNavItems', () => {
  it('esconde conversa antes do guide', () => {
    expect(guestNavItems(false).map((item) => item.path)).toEqual(['/musicas', '/fotos'])
    expect(guestNavItems(true).map((item) => item.path)).toEqual([
      '/musicas',
      '/fotos',
      '/conversa',
    ])
  })
})

describe('guestHopNeighbors', () => {
  it('liga foto e música quando conversa ainda não aparece', () => {
    expect(guestHopNeighbors('/fotos', false)).toEqual({
      prev: expect.objectContaining({ path: '/musicas' }),
      next: expect.objectContaining({ path: '/musicas' }),
    })
  })

  it('gira música → foto → conversa', () => {
    expect(guestHopNeighbors('/musicas', true)?.next.path).toBe('/fotos')
    expect(guestHopNeighbors('/fotos', true)?.next.path).toBe('/conversa')
    expect(guestHopNeighbors('/conversa', true)?.next.path).toBe('/musicas')
  })

  it('ignora home', () => {
    expect(guestHopNeighbors('/', true)).toBeNull()
    expect(isGuestHopPath('/fotos')).toBe(true)
    expect(isGuestHopPath('/')).toBe(false)
  })
})
