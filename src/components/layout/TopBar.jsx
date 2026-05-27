import { useLocation } from 'react-router-dom'
import Icon from '../icons/Icon'

const LABELS = {
  '/dashboard': 'Dashboard',
  '/chat':      'Chat IA',
  '/projects':  'Projets',
  '/settings':  'Paramètres',
  '/login':     'Connexion',
  '/register':  'Inscription',
}

export default function TopBar({ onPalette }) {
  const location = useLocation()

  const label = Object.entries(LABELS).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] || ''

  return (
    <header style={{
      height: 56,
      flex: "0 0 56px",
      borderBottom: "1px solid var(--border-1)",
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      gap: 16,
      background: "rgba(8,8,14,0.5)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      position: "relative",
      zIndex: 5,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-2)", fontSize: 13 }}>
        <span className="mono" style={{ color: "var(--text-3)", fontSize: 11 }}>~/atlace</span>
        <Icon name="chevronR" size={12} style={{ color: "var(--text-4)" }}/>
        <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{label}</span>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Search / palette trigger */}
      <button
        onClick={onPalette}
        className="btn"
        style={{ background: "var(--surface-0)", color: "var(--text-2)", width: 260, justifyContent: "space-between" }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="search" size={13}/>
          <span style={{ fontSize: 12.5, fontWeight: 400 }}>Rechercher, naviguer, invoquer…</span>
        </span>
        <span style={{ display: "inline-flex", gap: 4 }}>
          <span className="kbd">⌘</span><span className="kbd">K</span>
        </span>
      </button>

      {/* Status + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pill">
          <span className="dot dot-on"/>
          llama-3.3-70b
        </span>
        <button className="btn btn-ghost btn-icon" title="Notifications">
          <Icon name="bell" size={15}/>
        </button>
        <button className="btn btn-ghost btn-icon" title="Terminal">
          <Icon name="terminal" size={15}/>
        </button>
      </div>
    </header>
  )
}
