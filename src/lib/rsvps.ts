import { type Rsvp } from './rsvpMath'
import { requireSupabase } from './supabase'
import { getVoterKey } from './voter'

export type { Rsvp } from './rsvpMath'
export { summarizeRsvps } from './rsvpMath'

export type RsvpInput = {
  name: string
  attending: boolean
  plusOnes: number
}

type RsvpRow = {
  id: string
  name: string
  attending: boolean
  plus_ones: number
}

function mapRsvp(row: RsvpRow): Rsvp {
  const plusOnes = row.plus_ones
  return {
    id: row.id,
    name: row.name,
    attending: row.attending,
    plusOnes,
    heads: row.attending ? 1 + plusOnes : 0,
  }
}

export async function upsertRsvp(input: RsvpInput): Promise<Rsvp> {
  const client = requireSupabase()
  const voterKey = getVoterKey()
  const plusOnes = input.attending ? Math.max(0, Math.floor(input.plusOnes)) : 0

  const { data, error } = await client
    .from('rsvps')
    .upsert(
      {
        voter_key: voterKey,
        name: input.name.trim(),
        attending: input.attending,
        plus_ones: plusOnes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'voter_key' },
    )
    .select('id, name, attending, plus_ones')
    .single()

  if (error) {
    if (error.code === 'PGRST205' || /rsvps/.test(error.message)) {
      throw new Error('Falta rodar a migration no Supabase (supabase/migration-rsvps.sql).')
    }
    throw error
  }

  return mapRsvp(data as RsvpRow)
}

export async function listRsvps(): Promise<Rsvp[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('rsvps')
    .select('id, name, attending, plus_ones')
    .order('created_at', { ascending: true })

  if (error) {
    if (error.code === 'PGRST205' || /rsvps/.test(error.message)) {
      throw new Error('Falta rodar a migration no Supabase (supabase/migration-rsvps.sql).')
    }
    throw error
  }

  return ((data as RsvpRow[] | null) ?? []).map(mapRsvp)
}
