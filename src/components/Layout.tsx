import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { PARTY_NAME } from '../lib/config'
import { ConfigBanner } from './ConfigBanner'
import { GuestSessionProvider, useGuestSession } from './GuestSession'

function Shell() {
  const { name } = useGuestSession()
  const location = useLocation()
  const hostTv = location.pathname === '/anfitriao' || location.pathname.endsWith('/anfitriao')

  if (hostTv) {
    return (
      <div className="app-shell app-shell-host-tv">
        <ConfigBanner />
        <main className="host-tv-main">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <ConfigBanner />
      <header className="site-header">
        <Link to="/" className="brand-mark">
          {PARTY_NAME}
        </Link>
        <div className="site-header-end">
          <nav className="site-nav" aria-label="Principal">
            <NavLink to="/musicas" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Músicas
            </NavLink>
            <NavLink to="/conversa" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Conversa
            </NavLink>
            <NavLink to="/fotos" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Fotos
            </NavLink>
          </nav>
          <p className="guest-chip" title="Seu apelido neste celular">
            Olá, {name}
          </p>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export function Layout() {
  return (
    <GuestSessionProvider>
      <Shell />
    </GuestSessionProvider>
  )
}
