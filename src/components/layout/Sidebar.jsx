import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProjects } from '../../hooks/useProjects'
import Icon from '../icons/Icon'

function Logomark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id="lg-a" x1="0" x2="24" y1="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="1"/>
          <stop offset="1" stopColor="#fff" stopOpacity="0.6"/>
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
      <path d="M6 18 L12 5 L18 18 M8.5 13 L15.5 13" stroke="url(#lg-a)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20" cy="4.5" r="1.2" fill="var(--accent)"/>
    </svg>
  )
}

const NAV = [
  { id: "dashboard", path: "/dashboard", icon: "dashboard", label: "Dashboard",  hint: "G D" },
  { id: "chat",      path: "/chat",      icon: "chat",      label: "Chat IA",    hint: "G C" },
  { id: "projects",  path: "/projects",  icon: "folder",    label: "Projets",    hint: "G P" },
  { id: "settings",  path: "/settings",  icon: "settings",  label: "Paramètres", hint: "G S" },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { projects } = useProjects(user?.id)

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const recentProjects = (projects || []).slice(0, 3)

  // Exact match for /dashboard, startsWith for others
  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === path
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <aside className="glass" style={{
      width: 232, flex: "0 0 232px",
      borderRight: "1px solid var(--border-1)",
      borderTop: "none", borderBottom: "none", borderLeft: "none",
      background: "rgba(8,8,14,0.6)",
      display: "flex", flexDirection: "column",
      padding: "16px 14px 14px",
      gap: 14,
      position: "relative", zIndex: 5,
      overflowY: "auto",
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px" }}>
        <Logomark size={22}/>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="display" style={{ fontSize: 15, lineHeight: 1, letterSpacing: "0.04em" }}>ATLACE</span>
          <span className="mono" style={{ fontSize: 9.5, color: "var(--text-3)", letterSpacing: "0.16em" }}>AI · COMMAND</span>
        </div>
      </div>

      {/* Workspace switcher */}
      <button className="btn btn-sm" style={{ width: "100%", justifyContent: "space-between", height: 36, background: "var(--surface-0)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: "linear-gradient(135deg, #c8ff4d, #6bff9e)", display: "inline-block", flexShrink: 0 }}/>
          <span style={{ fontWeight: 500 }}>Personnel</span>
        </span>
        <Icon name="chevronD" size={13} style={{ color: "var(--text-3)" }}/>
      </button>

      {/* Navigation */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div className="eyebrow" style={{ padding: "8px 10px 4px" }}>Workspace</div>
        {NAV.map(item => (
          <div
            key={item.id}
            className="nav-item"
            data-active={isActive(item.path) ? "true" : "false"}
            onClick={() => navigate(item.path)}
          >
            <Icon
              name={item.icon}
              size={16}
              style={{ color: isActive(item.path) ? "var(--text-1)" : "var(--text-3)" }}
            />
            <span style={{ flex: 1 }}>{item.label}</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--text-4)" }}>{item.hint}</span>
          </div>
        ))}
      </nav>

      {/* Recent projects */}
      <div>
        <div className="eyebrow" style={{ padding: "8px 10px 4px" }}>Récents</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {recentProjects.length === 0 ? (
            <div style={{ padding: "6px 10px", color: "var(--text-4)", fontSize: 12 }}>Aucun projet</div>
          ) : recentProjects.map(p => (
            <div
              key={p.id}
              className="nav-item"
              style={{ height: 28, padding: "0 10px" }}
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <span style={{
                width: 4, height: 4, borderRadius: 999, flexShrink: 0,
                background: p.status === 'active' ? "var(--accent)" : "var(--text-4)",
                boxShadow: p.status === 'active' ? "0 0 6px var(--accent-glow)" : "none",
              }}/>
              <span style={{ flex: 1, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5 }}>
                {p.name}
              </span>
              <span className="mono" style={{ fontSize: 9.5, color: "var(--text-4)" }}>
                {p.status || 'active'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Quota Groq */}
      <div style={{ padding: "10px 10px 12px", borderRadius: 12, background: "var(--surface-0)", border: "1px solid var(--border-0)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.12em" }}>QUOTA GROQ</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>Libre</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, var(--accent), #6bff9e)", boxShadow: "0 0 8px var(--accent-glow)" }}/>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>llama-3.3-70b</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>illimité</span>
        </div>
      </div>

      {/* User */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderTop: "1px solid var(--border-0)", paddingTop: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 999, flexShrink: 0,
          background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Syne", fontWeight: 700, fontSize: 12,
        }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email}
          </div>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" title="Déconnexion" onClick={signOut}>
          <Icon name="logout" size={14}/>
        </button>
      </div>
    </aside>
  )
}
