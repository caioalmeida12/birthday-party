import { useEffect, useRef, useState } from 'react'
import { copy } from '../lib/copy'
import {
  hideMessage,
  listMessages,
  subscribeToMessages,
  type PartyMessage,
} from '../lib/messages'
import { isSupabaseConfigured } from '../lib/supabase'

type Props = {
  canModerate?: boolean
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function PartyChatWall({ canModerate = false }: Props) {
  const [messages, setMessages] = useState<PartyMessage[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  async function refresh() {
    const data = await listMessages()
    setMessages(data)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false

    void (async () => {
      try {
        const data = await listMessages()
        if (!cancelled) setMessages(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar conversa.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const unsubscribe = subscribeToMessages(() => {
      void refresh().catch(() => undefined)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const node = listRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages])

  async function onHide(messageId: string) {
    setBusyId(messageId)
    setError(null)
    try {
      await hideMessage(messageId)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra esconder.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="host-wall host-chat-wall">
      <header className="host-wall-header">
        <h2>{copy.hostChatTitle}</h2>
      </header>
      {loading ? <p className="muted">Carregando…</p> : null}
      {!loading && messages.length === 0 ? <p className="muted">{copy.hostChatEmpty}</p> : null}
      {error ? <p className="form-msg form-msg-error">{error}</p> : null}
      <ul className="chat-list chat-list-tv" ref={listRef}>
        {messages.map((message) => (
          <li key={message.id} className="chat-item">
            <div className="chat-item-main">
              <span className="chat-who">{message.submitted_by || copy.chatAnonymous}</span>
              <span className="chat-body">{message.body}</span>
              <span className="chat-time">{formatTime(message.created_at)}</span>
            </div>
            {canModerate ? (
              <button
                type="button"
                className="btn btn-ghost btn-tiny"
                disabled={busyId === message.id}
                onClick={() => {
                  void onHide(message.id)
                }}
              >
                {copy.hostChatHide}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
