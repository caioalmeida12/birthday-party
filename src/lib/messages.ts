import { assertMessageBody } from './messageText'
import { requireSupabase } from './supabase'

export {
  assertMessageBody,
  MAX_MESSAGE_LENGTH,
  normalizeMessageBody,
  visibleMessages,
} from './messageText'

export type PartyMessage = {
  id: string
  body: string
  submitted_by: string | null
  created_at: string
  hidden_at: string | null
}

export type PartyMessageInput = {
  body: string
  submittedBy?: string
}

type MessageRow = {
  id: string
  body: string
  submitted_by: string | null
  created_at: string
  hidden_at: string | null
}

const MESSAGE_SELECT = 'id, body, submitted_by, created_at, hidden_at'

function mapMessage(row: MessageRow): PartyMessage {
  return {
    id: row.id,
    body: row.body,
    submitted_by: row.submitted_by,
    created_at: row.created_at,
    hidden_at: row.hidden_at,
  }
}

function migrationHint(error: { code?: string; message: string }): Error | null {
  if (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /party_messages/.test(error.message)
  ) {
    return new Error(
      'Falta rodar a migration no Supabase (supabase/migration-party-chat-live.sql).',
    )
  }
  return null
}

export async function listMessages(limit = 80): Promise<PartyMessage[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('party_messages')
    .select(MESSAGE_SELECT)
    .is('hidden_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }

  return ((data as MessageRow[] | null) ?? []).map(mapMessage)
}

export async function postMessage(input: PartyMessageInput): Promise<PartyMessage> {
  const body = assertMessageBody(input.body)
  const submittedBy = input.submittedBy?.trim() || null
  const client = requireSupabase()
  const { data, error } = await client
    .from('party_messages')
    .insert({
      body,
      submitted_by: submittedBy,
    })
    .select(MESSAGE_SELECT)
    .single()

  if (error) {
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }

  return mapMessage(data as MessageRow)
}

export async function hideMessage(messageId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('party_messages')
    .update({ hidden_at: new Date().toISOString() })
    .eq('id', messageId)

  if (error) {
    const hinted = migrationHint(error)
    if (hinted) throw hinted
    throw error
  }
}

export function subscribeToMessages(onChange: () => void): () => void {
  const client = requireSupabase()
  const channel = client
    .channel('party-messages')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'party_messages' },
      onChange,
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
