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
  const [success, setSuccess] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [submittedBy, setSubmittedBy, persistNickname] = useGuestNickname()
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
    setSuccess(null)
    setSubmitting(true)
    try {
      await postMessage({ body, submittedBy })
      persistNickname()
      setBody('')
      setSuccess(copy.chatOk)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra enviar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>{copy.chatTitle}</h1>
        <p>{copy.chatLead}</p>
      </header>

      <form className="panel form" onSubmit={onSubmit}>
        <label>
          {copy.chatField}
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={copy.chatPlaceholder}
            maxLength={280}
            autoComplete="off"
          />
        </label>
        <NicknameField value={submittedBy} onChange={setSubmittedBy} />
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        {success ? <p className="form-msg form-msg-ok">{success}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={submitting || !isSupabaseConfigured}>
          {submitting ? copy.chatSubmitting : copy.chatSubmit}
        </button>
      </form>

      <div className="panel list-panel">
        {loading ? <p className="muted">Carregando…</p> : null}
        {!loading && messages.length === 0 ? <p className="muted">{copy.chatEmpty}</p> : null}
        <ul className="chat-list" ref={listRef}>
          {messages.map((message) => (
            <li key={message.id} className="chat-item">
              <span className="chat-who">{message.submitted_by || copy.chatAnonymous}</span>
              <span className="chat-body">{message.body}</span>
              <span className="chat-time">{formatTime(message.created_at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
