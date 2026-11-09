import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useGuestNickname } from '../components/GuestSession'
import { NicknameField } from '../components/NicknameField'
import { copy } from '../lib/copy'
import {
  listMessages,
  postMessage,
  subscribeToMessages,
  type PartyMessage,
} from '../lib/messages'
import { isSupabaseConfigured } from '../lib/supabase'

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

export function Chat() {
  const [messages, setMessages] = useState<PartyMessage[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [submittedBy, setSubmittedBy, persistNickname] = useGuestNickname()
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

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
          setError(err instanceof Error ? err.message : 'Não foi possível carregar a conversa.')
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await postMessage({ body, submittedBy })
      persistNickname()
      setBody('')
      await refresh()
      inputRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra enviar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page chat-page">
      <header className="chat-page-header">
        <h1>{copy.chatTitle}</h1>
        <p>{copy.chatLead}</p>
      </header>

      <div className="chat-thread panel" ref={listRef}>
        {loading ? <p className="muted chat-thread-empty">Carregando…</p> : null}
        {!loading && messages.length === 0 ? (
          <p className="muted chat-thread-empty">{copy.chatEmpty}</p>
        ) : null}
        <ul className="chat-list chat-list-guest">
          {messages.map((message) => (
            <li key={message.id} className="chat-bubble">
              <div className="chat-bubble-meta">
                <span className="chat-who">{message.submitted_by || copy.chatAnonymous}</span>
                <span className="chat-time">{formatTime(message.created_at)}</span>
              </div>
              <p className="chat-body">{message.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <form className="chat-composer panel" onSubmit={(event) => void onSubmit(event)}>
        <NicknameField value={submittedBy} onChange={setSubmittedBy} />
        <div className="chat-composer-row">
          <label className="chat-composer-field">
            <span className="sr-only">{copy.chatField}</span>
            <input
              ref={inputRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={copy.chatPlaceholder}
              maxLength={280}
              autoComplete="off"
              enterKeyHint="send"
            />
          </label>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || !isSupabaseConfigured || !body.trim()}
          >
            {submitting ? copy.chatSubmitting : copy.chatSubmit}
          </button>
        </div>
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
      </form>
    </section>
  )
}
