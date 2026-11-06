import { describe, expect, it } from 'vitest'
import { clampPlusOnes, headsForAttending, summarizeRsvps, type Rsvp } from './rsvpMath'

function rsvp(partial: Partial<Rsvp> & Pick<Rsvp, 'name' | 'attending' | 'plusOnes'>): Rsvp {
  const heads = partial.attending ? 1 + partial.plusOnes : 0
  return {
    id: partial.id ?? partial.name,
    heads: partial.heads ?? heads,
    ...partial,
  }
}

describe('clampPlusOnes', () => {
  it('limita entre 0 e 30', () => {
    expect(clampPlusOnes(-1)).toBe(0)
    expect(clampPlusOnes(2.9)).toBe(2)
    expect(clampPlusOnes(99)).toBe(30)
  })
})

describe('headsForAttending', () => {
  it('conta a pessoa + acompanhantes', () => {
    expect(headsForAttending(0)).toBe(1)
    expect(headsForAttending(3)).toBe(4)
  })
})

describe('summarizeRsvps', () => {
  it('soma cabeças só de quem vem', () => {
    const summary = summarizeRsvps([
      rsvp({ name: 'A', attending: true, plusOnes: 2 }),
      rsvp({ name: 'B', attending: true, plusOnes: 0 }),
      rsvp({ name: 'C', attending: false, plusOnes: 5 }),
    ])
    expect(summary).toEqual({ yes: 2, no: 1, heads: 4 })
  })
})
