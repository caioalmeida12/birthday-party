import { Link } from 'react-router-dom'
import { InviteArt } from '../components/InviteArt'
import { PhotoMosaic } from '../components/PhotoMosaic'
import { googleCalendarUrl } from '../lib/calendarLink'
import { partyInviteTitle } from '../lib/config'
import { copy } from '../lib/copy'
import {
  PARTY_DATE_LABEL,
  PARTY_PLACE_FULL,
  PARTY_TIME_LABEL,
  PARTY_WEEKDAY_LABEL,
  partyMapsUrl,
} from '../lib/partyDetails'

export function Home() {
  return (
    <section className="hero">
      <div className="hero-atmosphere" aria-hidden="true" />
      <PhotoMosaic />
      <div className="hero-content">
        <InviteArt className="invite-art invite-art-home" />
        <p className="hero-kicker">{copy.homeKicker}</p>
        <h1 className="hero-brand">{partyInviteTitle()}</h1>
        <p className="hero-when">
          {PARTY_WEEKDAY_LABEL}, {PARTY_DATE_LABEL} · {PARTY_TIME_LABEL}
          <a className="hero-where hero-where-link" href={partyMapsUrl()} target="_blank" rel="noreferrer">
            {PARTY_PLACE_FULL}
          </a>
        </p>
        <p className="hero-meta-links">
          <a href={googleCalendarUrl()} target="_blank" rel="noreferrer">
            {copy.homeCalendar}
          </a>
        </p>
        <div className="hero-actions hero-actions-stack">
          <Link className="hero-action" to="/camera">
            <span className="btn btn-primary btn-lg">{copy.hostQrCameraTitle}</span>
          </Link>
          <Link className="hero-action" to="/musicas">
            <span className="btn btn-ghost btn-lg">{copy.homeMusicCta}</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
