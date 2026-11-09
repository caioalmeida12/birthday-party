import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { PARTY_NAME } from '../lib/config'
import { guestNavItems, isGuestHopPath } from '../lib/guestPages'
import { ConfigBanner } from './ConfigBanner'
import { GuestSessionProvider, useGuestSession } from './GuestSession'
import { GuestSideHop } from './GuestSideHop'

function Shell() {
  const { name, ready } = useGuestSession()
  const location = useLocation()
  const hostTv = location.pathname === '/anfitriao' || location.pathname.endsWith('/anfitriao')
  const cameraSolo = location.pathname === '/camera' || location.pathname.endsWith('/camera')
  const hopPages = isGuestHopPath(location.pathname)
  const navItems = guestNavItems(ready)

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
    <div
      className={`app-shell${cameraSolo ? ' app-shell-camera' : ''}${hopPages ? ' app-shell-hopping' : ''}`}
    >
      <ConfigBanner />
      {!cameraSolo ? (
        <header className="site-header">
          <Link to="/" className="brand-mark">
            {PARTY_NAME}
          </Link>
          <div className="site-header-end">
            <nav className="site-nav" aria-label="Principal">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                >
                  <span className="site-nav-emoji" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            {ready && name ? (
              <p className="guest-chip" title="Seu apelido neste celular">
                Olá, {name}
              </p>
            ) : null}
          </div>
        </header>
      ) : null}
      {hopPages ? <GuestSideHop pathname={location.pathname} ready={ready} /> : null}
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
