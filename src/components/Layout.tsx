import { Link, NavLink, Outlet } from 'react-router-dom'
import { PARTY_NAME } from '../lib/config'
import { ConfigBanner } from './ConfigBanner'

export function Layout() {
  return (
    <div className="app-shell">
      <ConfigBanner />
      <header className="site-header">
        <Link to="/" className="brand-mark">
          {PARTY_NAME}
        </Link>
        <nav className="site-nav" aria-label="Principal">
          <NavLink to="/musicas" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Músicas
          </NavLink>
          <NavLink to="/fotos" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Fotos
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        Feito com carinho · host no GitHub Pages
      </footer>
    </div>
  )
}
