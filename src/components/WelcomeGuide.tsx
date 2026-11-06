import { useState, type FormEvent } from 'react'
import { PARTY_NAME } from '../lib/config'
import {
  PARTY_DATE_LABEL,
  PARTY_PLACE_FULL,
  PARTY_PLACE_NAME,
  PARTY_PLACE_REGION,
  PARTY_WEEKDAY_LABEL,
} from '../lib/partyDetails'

export type WelcomeGuideFinish = {
  name: string
  goToPhotos: boolean
}

type Props = {
  initialName?: string
  onFinish: (result: WelcomeGuideFinish) => void
}

const STEPS = 3

export function WelcomeGuide({ initialName = '', onFinish }: Props) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(initialName)
  const [error, setError] = useState<string | null>(null)

  function goNext() {
    setError(null)
    setStep((current) => Math.min(current + 1, STEPS - 1))
  }

  function goBack() {
    setError(null)
    setStep((current) => Math.max(current - 1, 0))
  }

  function finish(goToPhotos: boolean) {
    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Conta pra gente como te chamam.')
      return
    }
    onFinish({ name: trimmed, goToPhotos })
  }

  function onSubmitName(event: FormEvent) {
    event.preventDefault()
    finish(true)
  }

  return (
    <section className="welcome-guide" aria-labelledby="welcome-guide-title">
      <div className="welcome-guide-atmosphere" aria-hidden="true" />
      <div className="welcome-guide-card">
        <p className="hero-kicker">Convite</p>
        <div className="welcome-steps" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, index) => (
            <span
              key={index}
              className={`welcome-dot${index === step ? ' welcome-dot-active' : ''}${index < step ? ' welcome-dot-done' : ''}`}
            />
          ))}
        </div>

        {step === 0 ? (
          <div className="welcome-pane" key="invite">
            <h1 id="welcome-guide-title" className="welcome-guide-title">
              Aniversário do {PARTY_NAME}
            </h1>
            <p className="welcome-guide-lead">
              Você está convidado pra celebrar comigo.
            </p>
            <dl className="welcome-facts">
              <div>
                <dt>Quando</dt>
                <dd>
                  {PARTY_WEEKDAY_LABEL}, {PARTY_DATE_LABEL}
                </dd>
              </div>
              <div>
                <dt>Onde</dt>
                <dd>
                  {PARTY_PLACE_NAME}
                  <span className="welcome-fact-sub">{PARTY_PLACE_REGION}</span>
                </dd>
              </div>
            </dl>
            <p className="welcome-guide-copy">
              Antes do dia, dá pra ajudar na festa por aqui — com uma foto e uma música.
            </p>
            <button className="btn btn-primary btn-lg welcome-full" type="button" onClick={goNext}>
              Continuar
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="welcome-pane" key="purpose">
            <h1 id="welcome-guide-title" className="welcome-guide-title">
              Pra que serve este cantinho
            </h1>
            <ul className="welcome-purposes">
              <li className="welcome-purpose welcome-purpose-photo">
                <strong>Foto</strong>
                <span>
                  Manda uma imagem sua (ou de um momento bom). Eu imprimo e uso na{' '}
                  <em>decoração</em> do {PARTY_PLACE_FULL} — vira parede da festa.
                </span>
                <span className="welcome-purpose-note">O importante é mandar antes do dia.</span>
              </li>
              <li className="welcome-purpose">
                <strong>Música</strong>
                <span>
                  Sugere o que você quer ouvir. Na festa toca na caixa de som, e a galera pode dizer
                  se gostou.
                </span>
              </li>
            </ul>
            <div className="welcome-nav">
              <button className="btn btn-ghost" type="button" onClick={goBack}>
                Voltar
              </button>
              <button className="btn btn-primary" type="button" onClick={goNext}>
                Quero mandar uma foto
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="welcome-pane" key="photo">
            <h1 id="welcome-guide-title" className="welcome-guide-title">
              Sua foto na festa
            </h1>
            <p className="welcome-guide-lead">
              Escolhe uma imagem que você curta ver impressa. Ela entra na decoração do sítio —
              não fica só na galeria do celular.
            </p>
            <p className="welcome-guide-copy">
              Pode ser você, a família, um rolê antigo com a galera… o que tiver carinho.
            </p>
            <form className="form welcome-name-form" onSubmit={onSubmitName}>
              <label>
                Seu nome ou apelido
                <input
                  name="name"
                  autoComplete="name"
                  autoCapitalize="words"
                  autoFocus
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="Ex.: Caio, Ju, Tio Zé"
                />
              </label>
              {error ? <p className="form-msg form-msg-error">{error}</p> : null}
              <button className="btn btn-primary btn-lg welcome-full" type="submit">
                Mandar minha foto agora
              </button>
              <button
                className="btn btn-ghost welcome-full"
                type="button"
                onClick={() => finish(false)}
              >
                Entrar e mandar depois
              </button>
            </form>
            <button className="welcome-back-link" type="button" onClick={goBack}>
              Voltar
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
