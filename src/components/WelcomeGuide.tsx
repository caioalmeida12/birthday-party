import { useState, type FormEvent } from 'react'
import { downloadIcs, googleCalendarUrl } from '../lib/calendarLink'
import { copy } from '../lib/copy'
import { partyMapsUrl } from '../lib/partyDetails'
import { InviteArt } from './InviteArt'
import { PhotoMosaic } from './PhotoMosaic'

export type WelcomeGuideFinish = {
  name: string
  goToPhotos: boolean
  attending: boolean
  plusOnes: number
}

type Props = {
  initialName?: string
  onFinish: (result: WelcomeGuideFinish) => void | Promise<void>
}

const STEPS = 5

export function WelcomeGuide({ initialName = '', onFinish }: Props) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(initialName)
  const [goToPhotos, setGoToPhotos] = useState(false)
  const [attending, setAttending] = useState<boolean | null>(null)
  const [plusOnes, setPlusOnes] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  function continueFromPhoto(wantPhotos: boolean) {
    if (!requireName()) {
      setStep(2)
      return
    }
    setGoToPhotos(wantPhotos)
    goNext()
  }

  async function submitRsvp(event: FormEvent) {
    event.preventDefault()
    const name = requireName()
    if (!name) {
      setStep(2)
      return
    }
    if (attending === null) {
      setError(copy.rsvpError)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onFinish({
        name,
        goToPhotos,
        attending,
        plusOnes: attending ? plusOnes : 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra salvar.')
      setSubmitting(false)
    }
  }

  return (
    <section className="welcome-guide" aria-labelledby="welcome-guide-title">
      <div className="welcome-guide-atmosphere" aria-hidden="true" />
      <PhotoMosaic />
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
            <InviteArt className="invite-art invite-art-guide" />
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
                  <span className="welcome-fact-sub">
                    {copy.inviteWhereNote} · {copy.inviteWhereSub}
                  </span>
                </dd>
              </div>
            </dl>
            <a
              className="btn btn-ghost welcome-full"
              href={googleCalendarUrl()}
              target="_blank"
              rel="noreferrer"
            >
              {copy.inviteCalendar}
            </a>
            <a
              className="btn btn-ghost welcome-full"
              href={partyMapsUrl()}
              target="_blank"
              rel="noreferrer"
            >
              {copy.inviteMaps}
            </a>
            <button
              className="welcome-back-link"
              type="button"
              onClick={() => downloadIcs()}
            >
              {copy.inviteCalendarApple}
            </button>
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
              onClick={() => continueFromPhoto(true)}
            >
              {copy.photoAskCta}
            </button>
            <button
              className="btn btn-ghost welcome-full"
              type="button"
              onClick={() => continueFromPhoto(false)}
            >
              {copy.photoAskLater}
            </button>
            <button className="welcome-back-link" type="button" onClick={goBack}>
              {copy.photoAskBack}
            </button>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="welcome-pane" key="rsvp">
            <h1 id="welcome-guide-title" className="welcome-guide-title">
              {copy.rsvpTitle}
            </h1>
            <p className="welcome-guide-lead">{copy.rsvpLead}</p>
            <form className="form welcome-name-form" onSubmit={(event) => void submitRsvp(event)}>
              <div className="rsvp-choice" role="group" aria-label={copy.rsvpTitle}>
                <button
                  type="button"
                  className={`btn rsvp-choice-btn${attending === true ? ' rsvp-choice-on' : ' btn-ghost'}`}
                  aria-pressed={attending === true}
                  onClick={() => {
                    setAttending(true)
                    setError(null)
                  }}
                >
                  {copy.rsvpYes}
                </button>
                <button
                  type="button"
                  className={`btn rsvp-choice-btn${attending === false ? ' rsvp-choice-on' : ' btn-ghost'}`}
                  aria-pressed={attending === false}
                  onClick={() => {
                    setAttending(false)
                    setPlusOnes(0)
                    setError(null)
                  }}
                >
                  {copy.rsvpNo}
                </button>
              </div>

              {attending === true ? (
                <label>
                  {copy.rsvpPlusLabel}
                  <input
                    type="number"
                    min={0}
                    max={30}
                    inputMode="numeric"
                    value={plusOnes}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setPlusOnes(Number.isFinite(next) ? Math.max(0, Math.min(30, next)) : 0)
                    }}
                  />
                  <span className="field-hint">{copy.rsvpPlusHint}</span>
                </label>
              ) : null}

              {error ? <p className="form-msg form-msg-error">{error}</p> : null}

              <div className="welcome-nav">
                <button className="btn btn-ghost" type="button" onClick={goBack} disabled={submitting}>
                  {copy.rsvpBack}
                </button>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? copy.rsvpSubmitting : copy.rsvpSubmit}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  )
}
