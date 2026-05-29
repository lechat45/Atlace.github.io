import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useApiKeys } from '../hooks/useApiKeys'
import Icon from '../components/icons/Icon'

/* ── Sparkline ──────────────────────────────────────────────── */
function Sparkline({ data, color = 'var(--text-2)', height = 36 }) {
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const W = 100, H = height
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - ((v - min) / range) * (H - 4) - 2,
  ])
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = d + ` L ${W} ${H} L 0 ${H} Z`
  const id = `spark-${color.replace(/[^a-z]/g,'')}-${Math.random().toString(36).slice(2,6)}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} stroke={color} fill="none" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

/* ── Metric tile ────────────────────────────────────────────── */
function MetricTile({ label, value, unit, sub, delta, deltaUp, data, color = 'var(--text-2)', icon, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      style={{
        padding: '18px 20px 14px',
        borderRadius: 14,
        border: `1px solid ${accent ? 'rgba(200,255,77,0.2)' : 'var(--border-1)'}`,
        background: accent
          ? 'linear-gradient(160deg, rgba(200,255,77,0.06), rgba(200,255,77,0.01))'
          : 'linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.008))',
        display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden',
        position: 'relative', cursor: 'default',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          fontFamily: 'Fira Code', fontSize: 9.5, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-3)',
        }}>{label}</span>
        {icon && (
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: accent ? 'rgba(200,255,77,0.1)' : 'var(--surface-1)',
            border: `1px solid ${accent ? 'rgba(200,255,77,0.2)' : 'var(--border-0)'}`,
            display: 'grid', placeItems: 'center', color: accent ? 'var(--accent)' : 'var(--text-2)',
          }}>
            <Icon name={icon} size={13}/>
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, lineHeight: 1, letterSpacing: '-0.02em' }}>
        <span style={{ color: accent ? 'var(--accent)' : 'var(--text-1)' }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 400, marginLeft: 4 }}>{unit}</span>}
      </div>

      {/* Delta */}
      {(delta || sub) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {delta && (
            <span style={{
              fontSize: 11, fontFamily: 'Fira Code',
              color: deltaUp ? 'var(--success)' : 'var(--danger)',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              {deltaUp ? '↑' : '↓'} {delta}
            </span>
          )}
          {sub && <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'Fira Code' }}>{sub}</span>}
        </div>
      )}

      {/* Sparkline */}
      {data && (
        <div style={{ marginTop: 8 }}>
          <Sparkline data={data} color={accent ? 'var(--accent)' : color} height={36} />
        </div>
      )}
    </motion.div>
  )
}

/* ── Bar chart ──────────────────────────────────────────────── */
function BarChart() {
  const data = [2,4,3,5,4,7,9,8,13,15,14,17,20,23,21,19,25,27,22,19,16,13,10,8]
  const max = Math.max(...data)
  const hours = Array.from({length: 24}, (_, i) => i)
  const now = new Date().getHours()

  return (
    <div style={{ height: 120 }}>
      <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: 3 }}>
        {data.map((v, i) => {
          const isPeak = i >= 14 && i <= 18
          const isCurrent = i === now
          const pct = (v / max) * 100
          return (
            <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
              <div
                style={{
                  height: `${pct}%`,
                  borderRadius: '3px 3px 0 0',
                  background: isCurrent
                    ? 'var(--accent)'
                    : isPeak
                      ? 'linear-gradient(180deg, rgba(200,255,77,0.65), rgba(200,255,77,0.15))'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05))',
                  boxShadow: isCurrent ? '0 0 16px var(--accent-glow)' : 'none',
                  transition: 'opacity 150ms',
                  minHeight: 2,
                }}
                title={`${String(i).padStart(2,'0')}h : ${v} sessions`}
              />
              {i % 6 === 0 && (
                <span style={{
                  position: 'absolute', bottom: -18,
                  left: '50%', transform: 'translateX(-50%)',
                  fontFamily: 'Fira Code', fontSize: 9, color: 'var(--text-4)', whiteSpace: 'nowrap',
                }}>{String(i).padStart(2,'0')}h</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Activity feed ──────────────────────────────────────────── */
function ActivityRow({ time, icon, title, meta, status }) {
  const statusColor = status === 'ok' ? 'var(--accent)' : status === 'warn' ? 'var(--warn)' : 'var(--text-3)'
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '60px 28px 1fr auto',
      gap: 12, alignItems: 'center', padding: '8px 20px',
      borderBottom: '1px solid var(--border-0)',
    }}>
      <span style={{ fontFamily: 'Fira Code', fontSize: 10.5, color: 'var(--text-4)', textAlign: 'right' }}>{time}</span>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: 'var(--surface-1)',
        border: '1px solid var(--border-0)',
        display: 'grid', placeItems: 'center',
        color: statusColor,
      }}>
        <Icon name={icon} size={13}/>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{meta}</div>
      </div>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: statusColor,
        boxShadow: status === 'ok' ? '0 0 6px var(--accent-glow)' : 'none',
        ...(status === 'ok' && { animation: 'pulseDot 2.5s ease-in-out infinite' }),
      }} />
    </div>
  )
}

/* ── Model card ─────────────────────────────────────────────── */
function ModelCard({ name, provider, latency, active, primary, onUse }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
      padding: '10px 12px', borderRadius: 10,
      border: primary ? '1px solid rgba(200,255,77,0.25)' : '1px solid var(--border-0)',
      background: primary ? 'rgba(200,255,77,0.05)' : 'var(--surface-0)',
      transition: 'border-color 150ms',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: active ? 'var(--accent)' : 'var(--text-4)',
        boxShadow: active ? '0 0 8px var(--accent-glow)' : 'none',
        flexShrink: 0,
        ...(active && { animation: 'pulseDot 2.5s ease-in-out infinite' }),
      }} />
      <div>
        <div style={{ fontFamily: 'Fira Code', fontSize: 12, color: primary ? 'var(--accent)' : 'var(--text-1)', fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{provider} · {latency}</div>
      </div>
      {primary
        ? <span style={{
            fontFamily: 'Fira Code', fontSize: 9, color: 'var(--accent)',
            border: '1px solid rgba(200,255,77,0.3)',
            background: 'rgba(200,255,77,0.08)',
            padding: '2px 6px', borderRadius: 4, letterSpacing: '0.06em',
          }}>PRIMARY</span>
        : <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11, padding: '0 8px' }} onClick={onUse}>Utiliser</button>
      }
    </div>
  )
}

/* ── Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projects, loading: projectsLoading } = useProjects(user?.id)
  const { keys } = useApiKeys(user?.id)

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utilisateur'
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const activeProjects = (projects || []).filter(p => p.status === 'active')
  const totalKeys = (keys || []).length
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const stall = { delay: 0.05 }

  return (
    <div className="fade-in" style={{ padding: '24px 24px 40px', maxWidth: 1440, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Fira Code', fontSize: 10.5, color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            {today}
          </div>
          <h1 style={{ margin: 0, fontFamily: 'Syne', fontWeight: 800, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {greeting}, {displayName}.<br/>
            <span style={{ color: 'var(--text-3)', fontWeight: 600, fontSize: 24 }}>Voici l'état de votre cockpit.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn" onClick={() => window.location.reload()}>
            <Icon name="refresh" size={13}/> Rafraîchir
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>
            <Icon name="sparkles" size={14}/> Nouvelle requête
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        <MetricTile
          label="Projets actifs" value={String(activeProjects.length)}
          icon="folder" accent
          sub="projets en cours"
          data={[0,1,1,2,2,2,3,3,activeProjects.length]}
        />
        <MetricTile
          label="Clés API" value={String(totalKeys)}
          icon="key"
          sub="dans le vault"
          data={[0,0,1,1,2,2,totalKeys,totalKeys,totalKeys]}
        />
        <MetricTile
          label="Latence Groq" value="118" unit="ms"
          icon="cpu"
          delta="−5%" deltaUp
          sub="p95 LPU"
          data={[145,138,132,128,125,123,121,120,119,118]}
        />
        <MetricTile
          label="Tokens / session" value="~4" unit="K"
          icon="sparkles"
          sub="moyenne"
          data={[2,3,4,3,5,6,4,5,4,4]}
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>

        {/* Activity chart card */}
        <section style={{
          borderRadius: 14, border: '1px solid var(--border-1)',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Syne', fontWeight: 700, fontSize: 16 }}>Activité · 24h</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>Sessions par heure</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['6h', '24h', '7j'].map((t, i) => (
                <button key={t} className="btn btn-ghost btn-sm"
                  style={{ height: 26, fontSize: 11.5, background: i === 1 ? 'var(--surface-2)' : 'transparent', border: i === 1 ? '1px solid var(--border-2)' : 'none' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '4px 20px 28px' }}>
            <BarChart />
          </div>

          <div style={{ borderTop: '1px solid var(--border-0)' }}>
            <ActivityRow time="maintenant" icon="sparkles" title="Groq · llama-3.3-70b actif" meta="Connexion LPU établie · prêt" status="ok" />
            <ActivityRow time="récent"     icon="key"      title="Vault de clés API"           meta={`${totalKeys} clé${totalKeys !== 1 ? 's' : ''} configurée${totalKeys !== 1 ? 's' : ''}`} status="ok" />
            <ActivityRow time="récent"     icon="folder"   title="Projets chargés"            meta={`${activeProjects.length} projet${activeProjects.length !== 1 ? 's' : ''} actif${activeProjects.length !== 1 ? 's' : ''}`} status="ok" />
          </div>
        </section>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Models */}
          <section style={{
            borderRadius: 14, border: '1px solid var(--border-1)',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>Modèles IA</h2>
              <span style={{ fontFamily: 'Fira Code', fontSize: 9.5, color: 'var(--accent)', padding: '2px 7px', background: 'rgba(200,255,77,0.1)', border: '1px solid rgba(200,255,77,0.2)', borderRadius: 4 }}>Groq</span>
            </div>
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ModelCard name="llama-3.3-70b" provider="Groq" latency="p95 118ms" active primary />
              <ModelCard name="llama-3.1-8b"  provider="Groq" latency="p95 45ms"  active onUse={() => navigate('/chat')} />
              <ModelCard name="mixtral-8x7b"  provider="Groq" latency="p95 89ms"  active onUse={() => navigate('/chat')} />
              <ModelCard name="gemma2-9b"      provider="Groq" latency="p95 62ms"  active={false} onUse={() => navigate('/chat')} />
            </div>
          </section>

          {/* Quick actions */}
          <section style={{
            borderRadius: 14, border: '1px solid var(--border-1)',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))',
          }}>
            <div style={{ padding: '16px 16px 10px' }}>
              <h2 style={{ margin: 0, fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>Actions rapides</h2>
            </div>
            <div style={{ padding: '0 12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: 'sparkles', label: 'Nouveau prompt', action: () => navigate('/chat'), accent: true },
                { icon: 'folder',   label: 'Nouveau projet', action: () => navigate('/projects') },
                { icon: 'key',      label: 'Clé API',         action: () => navigate('/settings') },
                { icon: 'settings', label: 'Paramètres',      action: () => navigate('/settings') },
              ].map(a => (
                <button key={a.label}
                  onClick={a.action}
                  style={{
                    height: 60, padding: '10px 12px',
                    borderRadius: 10, cursor: 'pointer',
                    border: a.accent ? '1px solid rgba(200,255,77,0.2)' : '1px solid var(--border-0)',
                    background: a.accent ? 'rgba(200,255,77,0.05)' : 'var(--surface-0)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-start', justifyContent: 'space-between',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = a.accent ? 'rgba(200,255,77,0.1)' : 'var(--surface-1)'
                    e.currentTarget.style.borderColor = a.accent ? 'rgba(200,255,77,0.4)' : 'var(--border-1)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = a.accent ? 'rgba(200,255,77,0.05)' : 'var(--surface-0)'
                    e.currentTarget.style.borderColor = a.accent ? 'rgba(200,255,77,0.2)' : 'var(--border-0)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Icon name={a.icon} size={14} style={{ color: a.accent ? 'var(--accent)' : 'var(--text-3)' }}/>
                  <span style={{ fontSize: 12, fontWeight: 500, color: a.accent ? 'var(--accent)' : 'var(--text-1)' }}>{a.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Projects table */}
      <div style={{ marginTop: 14 }}>
        <section style={{
          borderRadius: 14, border: '1px solid var(--border-1)',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Syne', fontWeight: 700, fontSize: 16 }}>Projets</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
                {activeProjects.length} actif{activeProjects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>Voir tout</button>
              <button className="btn btn-sm" onClick={() => navigate('/projects')}>
                <Icon name="plus" size={12}/> Nouveau
              </button>
            </div>
          </div>

          <div>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 60px',
              padding: '6px 20px 8px',
              borderBottom: '1px solid var(--border-1)',
              fontFamily: 'Fira Code', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-4)',
            }}>
              <span>Projet</span><span>Statut</span><span>Langage</span><span>Créé</span><span/>
            </div>

            {projectsLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>Chargement…</div>
            ) : (projects || []).length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                <div style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 16 }}>Aucun projet pour l'instant</div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')}>
                  <Icon name="plus" size={12}/> Créer un projet
                </button>
              </div>
            ) : (
              (projects || []).slice(0, 6).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 60px',
                    padding: '11px 20px', alignItems: 'center',
                    borderBottom: '1px solid var(--border-0)',
                    cursor: 'pointer', transition: 'background 100ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-0)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)' }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 2 }}>
                      {p.description ? p.description.slice(0, 52) + (p.description.length > 52 ? '…' : '') : '—'}
                    </div>
                  </div>
                  <div>
                    {p.status === 'active'
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontFamily: 'Fira Code', color: 'var(--accent)', background: 'rgba(200,255,77,0.08)', border: '1px solid rgba(200,255,77,0.25)', padding: '2px 8px', borderRadius: 4 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', animation: 'pulseDot 2.5s infinite' }}/>ACTIF</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontFamily: 'Fira Code', color: 'var(--text-3)', background: 'var(--surface-1)', border: '1px solid var(--border-0)', padding: '2px 8px', borderRadius: 4 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-4)' }}/>{(p.status || 'draft').toUpperCase()}</span>
                    }
                  </div>
                  <span style={{ fontFamily: 'Fira Code', fontSize: 12, color: 'var(--text-2)' }}>{p.main_language || 'JS'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); navigate(`/projects/${p.id}`) }}>
                      <Icon name="external" size={12}/>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
