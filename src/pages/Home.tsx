import { Link } from 'react-router-dom'
import { PARTY_NAME, PARTY_TAGLINE } from '../lib/config'

export function Home() {
  return (
    <section className="hero">
      <div className="hero-atmosphere" aria-hidden="true" />
      <div className="hero-content">
        <p className="hero-kicker">Você está convidado</p>
        <h1 className="hero-brand">{PARTY_NAME}</h1>
        <p className="hero-tagline">{PARTY_TAGLINE}</p>
        <div className="hero-actions hero-actions-stack">
          <Link className="hero-action" to="/musicas">
            <span className="btn btn-primary">Mandar uma música</span>
            <span className="hero-action-hint">Vai tocar na festa, na caixa de som.</span>
          </Link>
          <Link className="hero-action" to="/fotos">
            <span className="btn btn-ghost">Mandar uma foto</span>
            <span className="hero-action-hint">
              Manda antes do dia — eu imprimo pra decorar a festa.
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
