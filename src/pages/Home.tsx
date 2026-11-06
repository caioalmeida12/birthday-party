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
          <span className="hero-where">{PARTY_PLACE_FULL}</span>
        </p>
        <p className="hero-tagline">{copy.homeTagline}</p>
        <div className="hero-actions hero-actions-stack">
          <a
            className="hero-action"
            href={googleCalendarUrl()}
            target="_blank"
            rel="noreferrer"
          >
            <span className="btn btn-ghost">{copy.homeCalendar}</span>
          </a>
          <a
            className="hero-action"
            href={partyMapsUrl()}
            target="_blank"
            rel="noreferrer"
          >
            <span className="btn btn-ghost">{copy.inviteMaps}</span>
          </a>
          <Link className="hero-action" to="/fotos">
            <span className="btn btn-primary">{copy.homePhotoCta}</span>
            <span className="hero-action-hint">{copy.homePhotoHint}</span>
          </Link>
          <Link className="hero-action" to="/musicas">
            <span className="btn btn-ghost">{copy.homeMusicCta}</span>
            <span className="hero-action-hint">{copy.homeMusicHint}</span>
          </Link>
          <Link className="hero-action" to="/conversa">
            <span className="btn btn-ghost">{copy.homeChatCta}</span>
            <span className="hero-action-hint">{copy.homeChatHint}</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
