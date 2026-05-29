import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Icon from '../icons/Icon'

const LABELS = {
  '/dashboard': { label: 'Dashboard',   icon: 'dashboard' },
  '/chat':      { label: 'Chat IA',     icon: 'chat' },
  '/projects':  { label: 'Projets',     icon: 'folder' },
  '/settings':  { label: 'Paramètres',  icon: 'settings' },
}

export default function TopBar({ onPalette }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [notifHover, setNotifHover] = useState(false)

  const current = Object.entries(LABELS).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )
  const pageLabel = current?.[1]?.label || ''
  const pageIcon  = current?.[1]?.icon  || ''

  return (
    <header style={{
      height: 52,
      flex: '0 0 52px',
      borderBottom: '1px solid var(--border-1)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12,
      background: 'rgba(6,6,10,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'relative', zIndex: 5,
    }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <span style={{ fontFamily: 'Fira Code', color: 'var(--text-4)', fontSize: 11 }}>~/atlace</span>
        <Icon name="chevronR" size={11} style={{ color: 'var(--text-4)' }}/>
        {pageIcon && <Icon name={pageIcon} size={13} style={{ color: 'var(--text-3)' }}/>}
        <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{pageLabel}</span>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Search bar */}
      <button
        onClick={onPalette}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 32, width: 240, padding: '0 10px',
          border: '1px solid var(--border-1)',
          background: 'var(--surface-0)',
          borderRadius: 8, cursor: 'pointer',
          transition: 'all 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-0)'; e.currentTarget.style.borderColor = 'var(--border-1)' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-3)', fontSize: 12 }}>
          <Icon name="search" size={12}/>
          Rechercher…
        </span>
        <span style={{ display: 'flex', gap: 3 }}>
          <span className="kbd" style={{ fontSize: 10 }}>⌘</span>
          <span className="kbd" style={{ fontSize: 10 }}>K</span>
        </span>
      </button>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Model pill */}
        <div
          onClick={() => navigate('/chat')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 28, padding: '0 10px',
            border: '1px solid rgba(200,255,77,0.2)',
            background: 'rgba(200,255,77,0.06)',
            borderRadius: 7, cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,255,77,0.4)'; e.currentTarget.style.background = 'rgba(200,255,77,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,255,77,0.2)'; e.currentTarget.style.background = 'rgba(200,255,77,0.06)' }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 8px var(--accent-glow)',
            animation: 'pulseDot 2s ease-in-out infinite',
          }}/>
          <span style={{ fontFamily: 'Fira Code', fontSize: 10.5, color: 'var(--accent)', letterSpacing: '0.02em' }}>
            llama-3.3-70b
          </span>
        </div>

        {/* Notifications */}
        <button
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border-1)',
            background: notifHover ? 'var(--surface-1)' : 'transparent',
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            color: 'var(--text-2)', position: 'relative',
            transition: 'all 150ms',
          }}
          onMouseEnter={() => setNotifHover(true)}
          onMouseLeave={() => setNotifHover(false)}
          title="Notifications"
        >
          <Icon name="bell" size={14}/>
        </button>

        {/* Terminal */}
        <button
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border-1)',
            background: 'transparent',
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            color: 'var(--text-2)', transition: 'all 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.color = 'var(--text-1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}
          title="Terminal"
        >
          <Icon name="terminal" size={14}/>
        </button>
      </div>
    </header>
  )
}
