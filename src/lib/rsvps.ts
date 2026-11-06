import { clampPlusOnes, headsForAttending, type Rsvp } from './rsvpMath'
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
  const plusOnes = clampPlusOnes(row.plus_ones)
  return {
    id: row.id,
    name: row.name,
    attending: row.attending,
    plusOnes,
    heads: row.attending ? headsForAttending(plusOnes) : 0,
  }
}

function migrationHint(error: { code?: string; message: string }): Error | null {
  if (error.code === 'PGRST205' || /rsvps/.test(error.message)) {
    return new Error('Falta rodar a migration no Supabase (supabase/migration-rsvps.sql).')
  }
  if (error.code === '42501' || /permission|policy|RLS/i.test(error.message)) {
    return new Error(
      'Falta rodar a migration no Supabase (supabase/migration-rsvp-host-edit.sql).',
    )
  }
  return null
}

export async function upsertRsvp(input: RsvpInput): Promise<Rsvp> {
  const client = requireSupabase()
  const voterKey = getVoterKey()
  const plusOnes = input.attending ? clampPlusOnes(input.plusOnes) : 0

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
    const hinted = migrationHint(error)
    if (hinted) throw hinted
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
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }

  return ((data as RsvpRow[] | null) ?? []).map(mapRsvp)
}

export async function updateRsvpPlusOnes(rsvpId: string, plusOnes: number): Promise<Rsvp> {
  const client = requireSupabase()
  const next = clampPlusOnes(plusOnes)
  const { data, error } = await client
    .from('rsvps')
    .update({
      plus_ones: next,
      attending: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rsvpId)
    .select('id, name, attending, plus_ones')
    .single()

  if (error) {
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }

  return mapRsvp(data as RsvpRow)
}

export async function deleteRsvp(rsvpId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('rsvps').delete().eq('id', rsvpId)
  if (error) {
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }
}
