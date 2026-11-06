import { Link } from 'react-router-dom'
import { PARTY_NAME } from '../lib/config'
import { copy } from '../lib/copy'
import { PARTY_DATE_LABEL, PARTY_PLACE_FULL, PARTY_WEEKDAY_LABEL } from '../lib/partyDetails'

export function Home() {
  return (
    <section className="hero">
      <div className="hero-atmosphere" aria-hidden="true" />
      <div className="hero-content">
        <p className="hero-kicker">{copy.homeKicker}</p>
        <h1 className="hero-brand">{PARTY_NAME}</h1>
        <p className="hero-when">
          {PARTY_WEEKDAY_LABEL}, {PARTY_DATE_LABEL}
          <span className="hero-where">{PARTY_PLACE_FULL}</span>
        </p>
        <p className="hero-tagline">{copy.homeTagline}</p>
        <div className="hero-actions hero-actions-stack">
          <Link className="hero-action" to="/fotos">
            <span className="btn btn-primary">{copy.homePhotoCta}</span>
            <span className="hero-action-hint">{copy.homePhotoHint}</span>
          </Link>
          <Link className="hero-action" to="/musicas">
            <span className="btn btn-ghost">{copy.homeMusicCta}</span>
            <span className="hero-action-hint">{copy.homeMusicHint}</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
