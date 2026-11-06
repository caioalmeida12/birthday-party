export type Rsvp = {
  id: string
  name: string
  attending: boolean
  plusOnes: number
  /** Pessoas pra comida: 0 se não vai; senão 1 + acompanhantes. */
  heads: number
}

export const MAX_RSVP_PLUS_ONES = 30

/** Acompanhantes válidos pro RSVP (0–30). */
export function clampPlusOnes(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(MAX_RSVP_PLUS_ONES, Math.max(0, Math.floor(value)))
}

export function headsForAttending(plusOnes: number): number {
  return 1 + clampPlusOnes(plusOnes)
}

export function summarizeRsvps(rsvps: Rsvp[]): {
  yes: number
  no: number
  heads: number
} {
  let yes = 0
  let no = 0
  let heads = 0
  for (const entry of rsvps) {
    if (entry.attending) {
      yes += 1
      heads += entry.heads
    } else {
      no += 1
    }
  }
  return { yes, no, heads }
}
