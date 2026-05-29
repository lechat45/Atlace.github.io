import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useProjects } from '../../hooks/useProjects'
import Icon from '../icons/Icon'

const NAV = [
  { id: 'dashboard', path: '/dashboard', icon: 'dashboard', label: 'Dashboard',   hint: 'G D' },
  { id: 'chat',      path: '/chat',      icon: 'chat',      label: 'Chat IA',     hint: 'G C' },
  { id: 'projects',  path: '/projects',  icon: 'folder',    label: 'Projets',     hint: 'G P' },
  { id: 'settings',  path: '/settings',  icon: 'settings',  label: 'Paramètres',  hint: 'G S' },
]

function Logomark({ size = 22 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.33),
      background: 'linear-gradient(135deg, rgba(200,255,77,0.18), rgba(107,255,158,0.08))',
      border: '1px solid rgba(200,255,77,0.28)',
      display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M6 18 L12 5 L18 18 M8.5 13 L15.5 13" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { projects } = useProjects(user?.id)

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const recentProjects = (projects || []).slice(0, 4)

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === path
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <aside style={{
      width: 228, flex: '0 0 228px',
      borderRight: '1px solid var(--border-1)',
      background: 'rgba(6,6,10,0.75)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      display: 'flex', flexDirection: 'column',
      padding: '14px 12px 12px',
      gap: 12, position: 'relative', zIndex: 5,
      overflowY: 'auto',
    }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px 8px', borderBottom: '1px solid var(--border-0)' }}>
        <Logomark size={26} />
        <div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, letterSpacing: '0.06em', lineHeight: 1.2 }}>ATLACE</div>
          <div style={{ fontFamily: 'Fira Code', fontSize: 9, color: 'var(--text-4)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>AI Command Center</div>
        </div>
      </div>

      {/* Workspace pill */}
      <button style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 10px', borderRadius: 9,
        border: '1px solid var(--border-1)',
        background: 'var(--surface-0)',
        cursor: 'pointer', width: '100%',
        transition: 'background 120ms',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-0)'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), #6bff9e)',
            boxShadow: '0 0 8px var(--accent-glow)',
          }} />
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>Personnel</span>
        </span>
        <Icon name="chevronD" size={12} style={{ color: 'var(--text-3)' }}/>
      </button>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div className="eyebrow" style={{ padding: '6px 8px 4px', fontSize: 9 }}>Workspace</div>
        {NAV.map(item => {
          const active = isActive(item.path)
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                height: 34, padding: '0 10px',
                borderRadius: 8, cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
                color: active ? 'var(--text-1)' : 'var(--text-2)',
                background: active ? 'var(--surface-2)' : 'transparent',
                transition: 'background 120ms, color 120ms',
                fontSize: 13, fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-1)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Active left bar */}
              {active && (
                <div style={{
                  position: 'absolute', left: -12, top: '20%', bottom: '20%',
                  width: 3, borderRadius: 2,
                  background: 'var(--accent)',
                  boxShadow: '0 0 10px var(--accent-glow)',
                }} />
              )}
              <Icon
                name={item.icon}
                size={15}
                style={{ color: active ? 'var(--accent)' : 'var(--text-3)', flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{
                fontFamily: 'Fira Code', fontSize: 9,
                color: 'var(--text-4)',
                background: 'var(--surface-0)',
                border: '1px solid var(--border-0)',
                padding: '1px 4px', borderRadius: 3,
              }}>{item.hint}</span>
            </div>
          )
        })}
      </nav>

      {/* Recent projects */}
      <div>
        <div className="eyebrow" style={{ padding: '6px 8px 4px', fontSize: 9 }}>Projets récents</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {recentProjects.length === 0 ? (
            <div
              onClick={() => navigate('/projects')}
              style={{
                padding: '8px 10px', color: 'var(--text-4)', fontSize: 12,
                borderRadius: 7, cursor: 'pointer', border: '1px dashed var(--border-0)',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-1)'; e.currentTarget.style.color = 'var(--text-3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-0)'; e.currentTarget.style.color = 'var(--text-4)' }}
            >
              <Icon name="plus" size={11}/> Créer un projet
            </div>
          ) : recentProjects.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 28, padding: '0 8px',
                borderRadius: 7, cursor: 'pointer',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                background: p.status === 'active' ? 'var(--accent)' : 'var(--text-4)',
                boxShadow: p.status === 'active' ? '0 0 6px var(--accent-glow)' : 'none',
              }} />
              <span style={{
                flex: 1, color: 'var(--text-2)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12.5,
              }}>{p.name}</span>
              <Icon name="chevronR" size={10} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Model status */}
      <div style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(200,255,77,0.05)',
        border: '1px solid rgba(200,255,77,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'Fira Code', fontSize: 9.5, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Groq LPU</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Fira Code', fontSize: 9.5, color: 'var(--accent)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)', animation: 'pulseDot 2s ease-in-out infinite' }} />
            Actif
          </span>
        </div>
        <div style={{ fontFamily: 'Fira Code', fontSize: 11, color: 'var(--text-1)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          llama-3.3-70b-versatile
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Fira Code', fontSize: 9.5, color: 'var(--text-4)' }}>p95 latency</span>
          <span style={{ fontFamily: 'Fira Code', fontSize: 9.5, color: 'var(--accent)' }}>~118ms</span>
        </div>
      </div>

      {/* User */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 8px',
        borderRadius: 10,
        border: '1px solid var(--border-1)',
        background: 'var(--surface-0)',
        transition: 'background 120ms',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: 'white',
          boxShadow: '0 0 12px rgba(139,92,246,0.4)',
        }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ fontFamily: 'Fira Code', fontSize: 10, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <button
          title="Déconnexion"
          onClick={signOut}
          style={{
            width: 28, height: 28, borderRadius: 7,
            border: '1px solid var(--border-1)',
            background: 'transparent', cursor: 'pointer',
            display: 'grid', placeItems: 'center',
            color: 'var(--text-3)',
            transition: 'all 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border-1)' }}
        >
          <Icon name="logout" size={13}/>
        </button>
      </div>
    </aside>
  )
}
