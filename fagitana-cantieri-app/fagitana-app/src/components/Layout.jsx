import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',             icon: '📊', label: 'Dashboard',   section: null },
  { to: '/calendario',   icon: '📅', label: 'Calendario',  section: null },
  { to: '/registrazione',icon: '📋', label: 'Nuova Registrazione', section: null },
  { to: '/cantieri',     icon: '🏗️', label: 'Cantieri',    section: 'Gestione' },
]

export default function Layout() {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const rawName = user?.user_metadata?.nome || user?.email?.split('.')[0] || ''
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const initials = displayName.slice(0, 2).toUpperCase() || 'FA'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-layout">
      {/* TOPBAR */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <div className="topbar-logo">FAGITANA <span>//</span> CANTIERI</div>
        </div>
        <div className="topbar-right">
          <div className="topbar-user">
            <div className="avatar">{initials}</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</span>
            {isAdmin && <span style={{ fontSize: 10, fontWeight: 700, background: '#f97316', color: 'white', padding: '2px 6px', borderRadius: 4 }}>ADMIN</span>}
          </div>
          <button className="btn-logout" onClick={handleSignOut}>Esci</button>
        </div>
      </header>

      {/* SIDEBAR OVERLAY (mobile) */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:89 }}
        />
      )}

      {/* SIDEBAR */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {NAV.map((item, i) => (
          <span key={item.to}>
            {item.section && <div className="sidebar-section">{item.section}</div>}
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          </span>
        ))}
      </nav>

      {/* MAIN */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
