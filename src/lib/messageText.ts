export const MAX_MESSAGE_LENGTH = 280

export type PartyMessageLike = {
  id: string
  body: string
  submitted_by: string | null
  created_at: string
  hidden_at: string | null
}

export function normalizeMessageBody(body: string): string {
  return body.replace(/\s+/g, ' ').trim()
}

export function assertMessageBody(body: string): string {
  const normalized = normalizeMessageBody(body)
  if (!normalized) {
    throw new Error('Escreve uma mensagem.')
  }
  if (normalized.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Mensagem longa demais (máx. ${MAX_MESSAGE_LENGTH}).`)
  }
  return normalized
}

/** Mensagens visíveis na TV / conversa (sem as escondidas pelo anfitrião). */
export function visibleMessages<T extends PartyMessageLike>(messages: T[]): T[] {
  return messages.filter((message) => !message.hidden_at)
}
