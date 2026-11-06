import { Link } from 'react-router-dom'
import { PARTY_NAME, PARTY_TAGLINE } from '../lib/config'
import {
  PARTY_DATE_LABEL,
  PARTY_PLACE_FULL,
  PARTY_WEEKDAY_LABEL,
} from '../lib/partyDetails'

export function Home() {
  return (
    <section className="hero">
      <div className="hero-atmosphere" aria-hidden="true" />
      <div className="hero-content">
        <p className="hero-kicker">Você está convidado</p>
        <h1 className="hero-brand">{PARTY_NAME}</h1>
        <p className="hero-when">
          {PARTY_WEEKDAY_LABEL}, {PARTY_DATE_LABEL}
          <span className="hero-where">{PARTY_PLACE_FULL}</span>
        </p>
        <p className="hero-tagline">{PARTY_TAGLINE}</p>
        <div className="hero-actions hero-actions-stack">
          <Link className="hero-action" to="/fotos">
            <span className="btn btn-primary">Mandar uma foto</span>
            <span className="hero-action-hint">
              Manda antes do dia — eu imprimo pra decorar a festa.
            </span>
          </Link>
          <Link className="hero-action" to="/musicas">
            <span className="btn btn-ghost">Mandar uma música</span>
            <span className="hero-action-hint">Vai tocar na festa, na caixa de som.</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
