import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { copy } from '../lib/copy'
import {
  getRememberedGuestName,
  hasSeenWelcomeGuide,
  markWelcomeGuideSeen,
  rememberGuestName,
} from '../lib/guestProfile'
import { upsertRsvp } from '../lib/rsvps'
import { isSupabaseConfigured } from '../lib/supabase'
import { WelcomeGuide, type WelcomeGuideFinish } from './WelcomeGuide'

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
      setError(copy.nameError)
      return
    }
    onContinue(trimmed)
  }

  return (
    <section className="name-gate" aria-labelledby="name-gate-title">
      <div className="name-gate-atmosphere" aria-hidden="true" />
      <div className="name-gate-card">
        <p className="hero-kicker">{copy.gateKicker}</p>
        <h1 id="name-gate-title" className="name-gate-title">
          {copy.gateTitle}
        </h1>
        <p className="name-gate-copy">{copy.gateBody}</p>
        <form className="form name-gate-form" onSubmit={onSubmit}>
          <label>
            Nome ou apelido
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
              placeholder={copy.namePlaceholder}
            />
          </label>
          {error ? <p className="form-msg form-msg-error">{error}</p> : null}
          <button className="btn btn-primary btn-lg" type="submit">
            {copy.gateCta}
          </button>
        </form>
      </div>
    </section>
  )
}

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [name, setNameState] = useState(() => getRememberedGuestName())
  const [ready, setReady] = useState(() => Boolean(getRememberedGuestName()))
  const [guideSeen, setGuideSeen] = useState(() => hasSeenWelcomeGuide())

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

  const finishGuide = useCallback(
    async (result: WelcomeGuideFinish) => {
      if (isSupabaseConfigured) {
        await upsertRsvp({
          name: result.name,
          attending: result.attending,
          plusOnes: result.plusOnes,
        })
      }
      markWelcomeGuideSeen()
      setGuideSeen(true)
      enterWithName(result.name)
      if (result.goToPhotos) {
        navigate('/fotos')
      }
    },
    [enterWithName, navigate],
  )

  const value = useMemo<GuestSessionValue>(
    () => ({
      name,
      ready,
      setName,
    }),
    [name, ready, setName],
  )

  let gate: ReactNode = null
  if (!guideSeen) {
    gate = <WelcomeGuide initialName={name} onFinish={finishGuide} />
  } else if (!ready) {
    gate = <NameGate onContinue={enterWithName} />
  }

  return (
    <GuestSessionContext.Provider value={value}>
      {gate ?? children}
    </GuestSessionContext.Provider>
  )
}
