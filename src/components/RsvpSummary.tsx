import { useEffect, useState } from 'react'
import { copy } from '../lib/copy'
import { MAX_RSVP_PLUS_ONES } from '../lib/rsvpMath'
import {
  deleteRsvp,
  listRsvps,
  summarizeRsvps,
  updateRsvpPlusOnes,
  type Rsvp,
} from '../lib/rsvps'
import { isSupabaseConfigured } from '../lib/supabase'

export function RsvpSummary() {
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    const data = await listRsvps()
    setRsvps(data)
  }

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

  async function onChangePlus(entry: Rsvp, nextPlus: number) {
    setBusyId(entry.id)
    setError(null)
    try {
      const updated = await updateRsvpPlusOnes(entry.id, nextPlus)
      setRsvps((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra atualizar.')
    } finally {
      setBusyId(null)
    }
  }

  async function onRemove(entry: Rsvp) {
    const confirmed = window.confirm(copy.rsvpHostRemoveConfirm(entry.name))
    if (!confirmed) return

    setBusyId(entry.id)
    setError(null)
    try {
      await deleteRsvp(entry.id)
      setRsvps((current) => current.filter((item) => item.id !== entry.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra remover.')
      await refresh().catch(() => undefined)
    } finally {
      setBusyId(null)
    }
  }

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
              {going.map((entry) => {
                const busy = busyId === entry.id
                return (
                  <li key={entry.id} className="rsvp-host-row">
                    <div className="rsvp-host-main">
                      <strong>{entry.name}</strong>
                      <span className="rsvp-host-plus-label">{copy.rsvpHostPlusLabel}</span>
                    </div>
                    <div className="rsvp-host-actions">
                      <button
                        type="button"
                        className="vote-btn"
                        disabled={busy || entry.plusOnes <= 0}
                        aria-label="Menos acompanhantes"
                        onClick={() => {
                          void onChangePlus(entry, entry.plusOnes - 1)
                        }}
                      >
                        {copy.rsvpHostMinus}
                      </button>
                      <span className="rsvp-host-plus-value">{copy.rsvpHostWith(entry.plusOnes)}</span>
                      <button
                        type="button"
                        className="vote-btn"
                        disabled={busy || entry.plusOnes >= MAX_RSVP_PLUS_ONES}
                        aria-label="Mais acompanhantes"
                        onClick={() => {
                          void onChangePlus(entry, entry.plusOnes + 1)
                        }}
                      >
                        {copy.rsvpHostPlus}
                      </button>
                      <button
                        type="button"
                        className="vote-btn vote-btn-active-down"
                        disabled={busy}
                        onClick={() => {
                          void onRemove(entry)
                        }}
                      >
                        {copy.rsvpHostRemove}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : null}
          {skipping.length > 0 ? (
            <div className="rsvp-host-skip">
              <p className="muted">{copy.rsvpHostNoTitle}</p>
              <ul className="rsvp-host-list">
                {skipping.map((entry) => {
                  const busy = busyId === entry.id
                  return (
                    <li key={entry.id} className="rsvp-host-row">
                      <strong>{entry.name}</strong>
                      <button
                        type="button"
                        className="vote-btn vote-btn-active-down"
                        disabled={busy}
                        onClick={() => {
                          void onRemove(entry)
                        }}
                      >
                        {copy.rsvpHostRemove}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
