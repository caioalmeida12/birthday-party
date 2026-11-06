import { useState, type FormEvent, type ReactNode } from 'react'
import { HOST_PIN } from '../lib/config'
import { copy } from '../lib/copy'

const STORAGE_KEY = 'birthday-party-host-ok'

function wasUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markUnlocked(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // private mode
  }
}

type Props = {
  children: ReactNode
}

export function HostGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(() => wasUnlocked())
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (unlocked) return children

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pin.trim() === HOST_PIN) {
      markUnlocked()
      setUnlocked(true)
      setError(null)
      return
    }
    setError(copy.hostPinError)
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>{copy.hostPinTitle}</h1>
        <p>{copy.hostPinLead}</p>
      </header>
      <form className="panel form" onSubmit={onSubmit}>
        <label>
          {copy.hostPinLabel}
          <input
            type="password"
            autoComplete="current-password"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value)
              if (error) setError(null)
            }}
            autoFocus
          />
        </label>
        {error ? <p className="form-msg form-msg-error">{error}</p> : null}
        <button className="btn btn-primary" type="submit">
          {copy.hostPinSubmit}
        </button>
      </form>
    </section>
  )
}
