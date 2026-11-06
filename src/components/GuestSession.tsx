import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { PARTY_NAME } from '../lib/config'
import { getRememberedGuestName, rememberGuestName } from '../lib/guestProfile'

type GuestSessionValue = {
  name: string
  ready: boolean
  setName: (name: string) => void
}

const GuestSessionContext = createContext<GuestSessionValue | null>(null)

export function useGuestSession(): GuestSessionValue {
  const value = useContext(GuestSessionContext)
  if (!value) {
    throw new Error('useGuestSession precisa estar dentro de GuestSessionProvider.')
  }
  return value
}

export function useGuestNickname(): [string, (value: string) => void, () => void] {
  const session = useGuestSession()
  const setValue = useCallback(
    (value: string) => {
      session.setName(value)
    },
    [session],
  )
  const persist = useCallback(() => {
    rememberGuestName(session.name)
  }, [session.name])
  return [session.name, setValue, persist]
}

function NameGate({ onContinue }: { onContinue: (name: string) => void }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Conta pra gente como te chamam.')
      return
    }
    onContinue(trimmed)
  }

  return (
    <section className="name-gate" aria-labelledby="name-gate-title">
      <div className="name-gate-atmosphere" aria-hidden="true" />
      <div className="name-gate-card">
        <p className="hero-kicker">Você está convidado</p>
        <h1 id="name-gate-title" className="name-gate-title">
          {PARTY_NAME}
        </h1>
        <p className="name-gate-copy">
          Antes de mandar música ou foto, conta como a galera te chama na festa.
        </p>
        <form className="form name-gate-form" onSubmit={onSubmit}>
          <label>
            Seu nome ou apelido
            <input
              name="name"
              autoComplete="name"
              autoCapitalize="words"
              autoFocus
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Ex.: Caio, Ju, Tio Zé"
            />
          </label>
          {error ? <p className="form-msg form-msg-error">{error}</p> : null}
          <button className="btn btn-primary btn-lg" type="submit">
            Entrar na festa
          </button>
        </form>
      </div>
    </section>
  )
}

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState(() => getRememberedGuestName())
  const [ready, setReady] = useState(() => Boolean(getRememberedGuestName()))

  const setName = useCallback((next: string) => {
    setNameState(next)
    const trimmed = next.trim()
    if (trimmed) rememberGuestName(trimmed)
  }, [])

  const enterWithName = useCallback((next: string) => {
    const trimmed = next.trim()
    if (!trimmed) return
    rememberGuestName(trimmed)
    setNameState(trimmed)
    setReady(true)
  }, [])

  const value = useMemo<GuestSessionValue>(
    () => ({
      name,
      ready,
      setName,
    }),
    [name, ready, setName],
  )

  return (
    <GuestSessionContext.Provider value={value}>
      {ready ? children : <NameGate onContinue={enterWithName} />}
    </GuestSessionContext.Provider>
  )
}
