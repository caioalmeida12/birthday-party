import { describe, expect, it } from 'vitest'
import { summarizeRsvps, type Rsvp } from './rsvpMath'

function rsvp(partial: Partial<Rsvp> & Pick<Rsvp, 'name' | 'attending' | 'plusOnes'>): Rsvp {
  const heads = partial.attending ? 1 + partial.plusOnes : 0
  return {
    id: partial.id ?? partial.name,
    heads: partial.heads ?? heads,
    ...partial,
  }
}

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
