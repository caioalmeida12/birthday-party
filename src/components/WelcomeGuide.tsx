import { useState, type FormEvent } from 'react'
import { copy } from '../lib/copy'

export type WelcomeGuideFinish = {
  name: string
  goToPhotos: boolean
}

type Props = {
  initialName?: string
  onFinish: (result: WelcomeGuideFinish) => void
}

const STEPS = 4

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

  function requireName(): string | null {
    const trimmed = draft.trim()
    if (!trimmed) {
      setError(copy.nameError)
      return null
    }
    setError(null)
    return trimmed
  }

  function onSubmitName(event: FormEvent) {
    event.preventDefault()
    if (!requireName()) return
    goNext()
  }

  function finish(goToPhotos: boolean) {
    const name = requireName()
    if (!name) {
      setStep(2)
      return
    }
    onFinish({ name, goToPhotos })
  }

  return (
    <section className="welcome-guide" aria-labelledby="welcome-guide-title">
      <div className="welcome-guide-atmosphere" aria-hidden="true" />
      <div className="welcome-guide-card">
        <p className="hero-kicker">{copy.inviteKicker}</p>
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
              {copy.inviteTitle}
            </h1>
            <dl className="welcome-facts">
              <div>
                <dt>Quando</dt>
                <dd>{copy.inviteWhen}</dd>
              </div>
              <div>
                <dt>Onde</dt>
                <dd>
                  {copy.inviteWhere}
                  <span className="welcome-fact-sub">{copy.inviteWhereSub}</span>
                </dd>
              </div>
            </dl>
            <button className="btn btn-primary btn-lg welcome-full" type="button" onClick={goNext}>
              {copy.inviteNext}
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="welcome-pane" key="purpose">
            <h1 id="welcome-guide-title" className="welcome-guide-title">
              {copy.purposeTitle}
            </h1>
            <ul className="welcome-purposes">
              <li className="welcome-purpose welcome-purpose-photo">
                <strong>{copy.purposePhotoTitle}</strong>
                <span>{copy.purposePhotoBody}</span>
              </li>
              <li className="welcome-purpose">
                <strong>{copy.purposeMusicTitle}</strong>
                <span>{copy.purposeMusicBody}</span>
              </li>
            </ul>
            <div className="welcome-nav">
              <button className="btn btn-ghost" type="button" onClick={goBack}>
                {copy.purposeBack}
              </button>
              <button className="btn btn-primary" type="button" onClick={goNext}>
                {copy.purposeNext}
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="welcome-pane" key="name">
            <h1 id="welcome-guide-title" className="welcome-guide-title">
              {copy.nameTitle}
            </h1>
            <p className="welcome-guide-lead">{copy.nameHint}</p>
            <form className="form welcome-name-form" onSubmit={onSubmitName}>
              <label>
                Nome ou apelido
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
                  placeholder={copy.namePlaceholder}
                />
              </label>
              {error ? <p className="form-msg form-msg-error">{error}</p> : null}
              <div className="welcome-nav">
                <button className="btn btn-ghost" type="button" onClick={goBack}>
                  {copy.nameBack}
                </button>
                <button className="btn btn-primary" type="submit">
                  {copy.nameNext}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="welcome-pane" key="photo">
            <h1 id="welcome-guide-title" className="welcome-guide-title">
              {copy.photoAskTitle}
            </h1>
            <p className="welcome-guide-lead">{copy.photoAskBody}</p>
            <button
              className="btn btn-primary btn-lg welcome-full"
              type="button"
              onClick={() => finish(true)}
            >
              {copy.photoAskCta}
            </button>
            <button
              className="btn btn-ghost welcome-full"
              type="button"
              onClick={() => finish(false)}
            >
              {copy.photoAskLater}
            </button>
            <button className="welcome-back-link" type="button" onClick={goBack}>
              {copy.photoAskBack}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
