import { useEffect, useId, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { PARTY_NAME } from '../lib/config'
import { copy } from '../lib/copy'
import { guestNavItems, isGuestHopPath } from '../lib/guestPages'
import { ConfigBanner } from './ConfigBanner'
import { GuestSessionProvider, useGuestSession } from './GuestSession'
import { GuestSideHop } from './GuestSideHop'

function Shell() {
  const { name, ready } = useGuestSession()
  const location = useLocation()
  const menuId = useId()
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const hostTv = location.pathname === '/anfitriao' || location.pathname.endsWith('/anfitriao')
  const cameraSolo = location.pathname === '/camera' || location.pathname.endsWith('/camera')
  const hopPages = isGuestHopPath(location.pathname)
  const navItems = guestNavItems(ready)
  const menuOpen = menuPath === location.pathname

  useEffect(() => {
    if (!menuOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuPath(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

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
            <button
              type="button"
              className={`site-menu-toggle${menuOpen ? ' is-open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? copy.navMenuClose : copy.navMenuOpen}
              onClick={() =>
                setMenuPath((current) => (current === location.pathname ? null : location.pathname))
              }
            >
              <span className="site-menu-toggle-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
          {menuOpen ? (
            <>
              <button
                type="button"
                className="site-menu-backdrop"
                aria-label={copy.navMenuClose}
                onClick={() => setMenuPath(null)}
              />
              <nav id={menuId} className="site-menu-panel" aria-label="Principal">
                {ready && name ? (
                  <p className="site-menu-chip" title="Seu apelido neste celular">
                    Olá, {name}
                  </p>
                ) : null}
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => (isActive ? 'active' : undefined)}
                    onClick={() => setMenuPath(null)}
                  >
                    <i className={`fa-solid ${item.icon} site-nav-icon`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <Link to="/" className="site-menu-home" onClick={() => setMenuPath(null)}>
                  {copy.navMenuHome}
                </Link>
              </nav>
            </>
          ) : null}
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
