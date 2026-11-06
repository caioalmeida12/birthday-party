import { useEffect, useState } from 'react'
import { copy } from '../lib/copy'
import { listRsvps, summarizeRsvps, type Rsvp } from '../lib/rsvps'
import { isSupabaseConfigured } from '../lib/supabase'

export function RsvpSummary() {
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    void (async () => {
      try {
        const data = await listRsvps()
        if (!cancelled) setRsvps(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Não deu pra carregar as confirmações.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!isSupabaseConfigured) return null

  const summary = summarizeRsvps(rsvps)
  const going = rsvps.filter((entry) => entry.attending)
  const skipping = rsvps.filter((entry) => !entry.attending)

  return (
    <div className="panel list-panel">
      <h2>{copy.rsvpHostTitle}</h2>
      {loading ? <p className="muted">Carregando…</p> : null}
      {error ? <p className="form-msg form-msg-error">{error}</p> : null}
      {!loading && !error && rsvps.length === 0 ? (
        <p className="muted">{copy.rsvpHostEmpty}</p>
      ) : null}
      {!loading && rsvps.length > 0 ? (
        <>
          <p className="queue-count">
            {copy.rsvpHostHeads(summary.heads)} · {copy.rsvpHostYes(summary.yes)} ·{' '}
            {copy.rsvpHostNo(summary.no)}
          </p>
          {going.length > 0 ? (
            <ul className="rsvp-host-list">
              {going.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.name}</strong>
                  <span>{copy.rsvpHostWith(entry.plusOnes)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {skipping.length > 0 ? (
            <p className="muted rsvp-host-no">
              Não: {skipping.map((entry) => entry.name).join(', ')}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
