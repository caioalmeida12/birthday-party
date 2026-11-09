import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { downloadIcs, googleCalendarUrl } from '../lib/calendarLink'
import { copy } from '../lib/copy'
import { partyMapsUrl } from '../lib/partyDetails'
import { plusOnesFromCompany } from '../lib/rsvpMath'
import { InviteArt } from './InviteArt'
import { PhotoMosaic } from './PhotoMosaic'

export type WelcomeGuideFinish = {
  name: string
  goToPhotos: boolean
  photoFile: File | null
  attending: boolean
  plusOnes: number
}

type Props = {
  initialName?: string
  onFinish: (result: WelcomeGuideFinish) => void | Promise<void>
}

type CompanyChoice = 'alone' | 'with'
type RsvpPhase = 'attend' | 'company' | 'count'

const STEPS = 4

export function WelcomeGuide({ initialName = '', onFinish }: Props) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(initialName)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [rsvpPhase, setRsvpPhase] = useState<RsvpPhase>('attend')
  const [plusOnes, setPlusOnes] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

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

  function onPickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null
    if (!next) return
    if (!requireName()) {
      setStep(1)
      return
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(next)
    setPhotoPreview(URL.createObjectURL(next))
    setError(null)
    // Selecionar já confirma — evita esquecer o segundo toque.
    goNext()
  }

  function openPhotoPicker() {
    if (!requireName()) {
      setStep(1)
      return
    }
    photoInputRef.current?.click()
  }

  function continueWithoutPhoto() {
    if (!requireName()) {
      setStep(1)
      return
    }
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
    goNext()
  }

  function continueWithPhoto() {
    if (!requireName()) {
      setStep(1)
      return
    }
    if (!photoFile) {
      setError(copy.photoAskNeedFile)
      return
    }
    goNext()
  }

  async function finishRsvp(attending: boolean, company: CompanyChoice | null, count: number) {
    const name = requireName()
    if (!name) {
      setStep(1)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onFinish({
        name,
        goToPhotos: Boolean(photoFile),
        photoFile,
        attending,
        plusOnes: attending ? plusOnesFromCompany(company, count) : 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra salvar.')
      setSubmitting(false)
    }
  }

  function onRsvpBack() {
    setError(null)
    if (rsvpPhase === 'count') {
      setRsvpPhase('company')
      return
    }
    if (rsvpPhase === 'company') {
      setRsvpPhase('attend')
      return
    }
    goBack()
  }

  function onSubmitCount(event: FormEvent) {
    event.preventDefault()
    void finishRsvp(true, 'with', plusOnes)
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

        {step === 2 ? (
          <div className="welcome-pane" key="photo">
            <h1 id="welcome-guide-title" className="welcome-guide-title">
              {copy.photoAskTitle}
            </h1>
            <p className="welcome-guide-lead">{copy.photoAskBody}</p>
            <input
              ref={photoInputRef}
              className="camera-file-input"
              type="file"
              accept="image/*"
              onChange={onPickPhoto}
            />
            {photoPreview ? (
              <div className="welcome-photo-preview">
                <img src={photoPreview} alt="" />
              </div>
            ) : null}
            {error ? <p className="form-msg form-msg-error">{error}</p> : null}
            {photoFile ? (
              <>
                <button
                  className="btn btn-primary btn-lg welcome-full"
                  type="button"
                  onClick={continueWithPhoto}
                >
                  {copy.photoAskContinue}
                </button>
                <button
                  className="btn btn-ghost welcome-full"
                  type="button"
                  onClick={openPhotoPicker}
                >
                  {copy.photoAskChange}
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-lg welcome-full"
                  type="button"
                  onClick={openPhotoPicker}
                >
                  {copy.photoAskCta}
                </button>
                <button
                  className="btn btn-ghost welcome-full"
                  type="button"
                  onClick={continueWithoutPhoto}
                >
                  {copy.photoAskLater}
                </button>
              </>
            )}
            <button className="welcome-back-link" type="button" onClick={goBack}>
              {copy.photoAskBack}
            </button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="welcome-pane" key={`rsvp-${rsvpPhase}`}>
            <h1 id="welcome-guide-title" className="welcome-guide-title">
              {rsvpPhase === 'attend'
                ? copy.rsvpTitle
                : rsvpPhase === 'company'
                  ? copy.rsvpCompanyLabel
                  : copy.rsvpPlusLabel}
            </h1>
            <p className="welcome-guide-lead">
              {rsvpPhase === 'attend'
                ? copy.rsvpLead
                : rsvpPhase === 'company'
                  ? copy.rsvpCompanyLead
                  : copy.rsvpPlusHint}
            </p>

            {rsvpPhase === 'attend' ? (
              <div className="rsvp-choice rsvp-choice-stack" role="group" aria-label={copy.rsvpTitle}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg rsvp-choice-btn"
                  disabled={submitting}
                  onClick={() => {
                    setError(null)
                    setRsvpPhase('company')
                  }}
                >
                  {copy.rsvpYes}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-lg rsvp-choice-btn"
                  disabled={submitting}
                  onClick={() => {
                    void finishRsvp(false, null, 0)
                  }}
                >
                  {submitting ? copy.rsvpSubmitting : copy.rsvpNo}
                </button>
              </div>
            ) : null}

            {rsvpPhase === 'company' ? (
              <div className="rsvp-choice rsvp-choice-stack" role="group" aria-label={copy.rsvpCompanyLabel}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg rsvp-choice-btn"
                  disabled={submitting}
                  onClick={() => {
                    void finishRsvp(true, 'alone', 0)
                  }}
                >
                  {submitting ? copy.rsvpSubmitting : copy.rsvpAlone}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-lg rsvp-choice-btn"
                  disabled={submitting}
                  onClick={() => {
                    setError(null)
                    setPlusOnes(1)
                    setRsvpPhase('count')
                  }}
                >
                  {copy.rsvpWith}
                </button>
              </div>
            ) : null}

            {rsvpPhase === 'count' ? (
              <form className="form welcome-name-form" onSubmit={onSubmitCount}>
                <label>
                  {copy.rsvpPlusField}
                  <input
                    type="number"
                    min={1}
                    max={30}
                    inputMode="numeric"
                    autoFocus
                    value={plusOnes}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setPlusOnes(Number.isFinite(next) ? Math.max(1, Math.min(30, next)) : 1)
                    }}
                  />
                </label>
                <button className="btn btn-primary btn-lg welcome-full" type="submit" disabled={submitting}>
                  {submitting ? copy.rsvpSubmitting : copy.rsvpSubmit}
                </button>
              </form>
            ) : null}

            {error ? <p className="form-msg form-msg-error">{error}</p> : null}

            <button
              className="welcome-back-link"
              type="button"
              onClick={onRsvpBack}
              disabled={submitting}
            >
              {copy.rsvpBack}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
