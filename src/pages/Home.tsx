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
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/musicas">
            Sugerir música
          </Link>
          <Link className="btn btn-ghost" to="/tocar">
            Tocar playlist
          </Link>
          <Link className="btn btn-ghost" to="/fotos">
            Enviar foto
          </Link>
        </div>
      </div>
    </section>
  )
}
