import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useApiKeys } from '../hooks/useApiKeys'
import Icon from '../components/icons/Icon'

// ── Sparkline ──────────────────────────────────────────────
function Sparkline({ data, color = "var(--text-2)", height = 32 }) {
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const W = 100, H = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4) - 2
    return [x, y]
  })
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ")
  const area = d + ` L ${W} ${H} L 0 ${H} Z`
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <path className="area" d={area} fill={color} fillOpacity="0.08"/>
      <path className="line" d={d} stroke={color} fill="none" strokeWidth="1.4"/>
    </svg>
  )
}

// ── MetricTile ─────────────────────────────────────────────
function MetricTile({ label, num, unit, delta, up, data, color }) {
  return (
    <div className="metric">
      <div className="lbl">{label}</div>
      <div className="num tabular">
        {num}{unit && <span className="unit">{unit}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        {delta && (
          <span className={"delta tabular " + (up ? "up" : "down")}>{delta}</span>
        )}
        <div style={{ flex: 1, marginLeft: delta ? 0 : "auto" }}>
          <Sparkline data={data} color={color || "var(--text-2)"}/>
        </div>
      </div>
    </div>
  )
}

// ── SectionHeader ──────────────────────────────────────────
function SectionHeader({ title, sub, actions, inset, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: inset ? "18px 18px 6px" : "20px 24px 14px", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 18, letterSpacing: "-0.01em" }}>{title}</h2>
        {sub && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</span>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>{actions || children}</div>
    </div>
  )
}

// ── BarChart ───────────────────────────────────────────────
function BarChart() {
  const data = [3,4,2,5,3,6,8,7,12,14,13,16,19,22,20,18,24,26,21,18,15,12,9,7]
  const max = Math.max(...data)
  return (
    <div style={{ height: 160, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", gap: 4, alignItems: "flex-end" }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{
              height: `${(v / max) * 100}%`,
              background: i >= 14 && i <= 18
                ? "linear-gradient(180deg, var(--accent), rgba(200,255,77,0.2))"
                : "linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.06))",
              borderRadius: "2px 2px 0 0",
              boxShadow: i >= 14 && i <= 18 ? "0 0 12px var(--accent-glow)" : "none",
            }}/>
          </div>
        ))}
      </div>
      <div style={{ height: 20, display: "flex", gap: 4, marginTop: 8 }}>
        {data.map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            {i % 4 === 0 && <span className="mono" style={{ fontSize: 9.5, color: "var(--text-4)" }}>{String(i).padStart(2,'0')}h</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projects, loading: projectsLoading } = useProjects(user?.id)
  const { keys } = useApiKeys(user?.id)

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utilisateur'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const activeProjects = (projects || []).filter(p => p.status === 'active')
  const totalKeys = (keys || []).length
  const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }).toUpperCase()

  return (
    <div className="fade-in" style={{ padding: "32px var(--pad-x)", maxWidth: 1440, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>OVERVIEW · {today}</div>
          <h1 className="display" style={{ margin: 0, fontSize: 38, lineHeight: 1.05 }}>
            {greeting}, {displayName}.<br/>
            <span style={{ color: "var(--text-3)" }}>Voici l'état de votre cockpit.</span>
          </h1>
          <div style={{ color: "var(--text-2)", marginTop: 8, fontSize: 14.5 }}>
            {activeProjects.length} projet{activeProjects.length !== 1 ? 's' : ''} actif{activeProjects.length !== 1 ? 's' : ''}, {totalKeys} clé{totalKeys !== 1 ? 's' : ''} API, modèle Groq connecté.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => window.location.reload()}>
            <Icon name="refresh" size={13}/><span>Rafraîchir</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>
            <Icon name="sparkles" size={14}/><span>Nouvelle requête</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        <MetricTile
          label="Projets actifs"
          num={String(activeProjects.length)}
          data={[0,1,1,2,2,3,3,3,4,4,activeProjects.length,activeProjects.length,activeProjects.length,activeProjects.length]}
          color="var(--accent)"
        />
        <MetricTile
          label="Clés API"
          num={String(totalKeys)}
          data={[0,0,1,1,1,2,2,2,3,3,totalKeys,totalKeys,totalKeys,totalKeys]}
        />
        <MetricTile
          label="Latence p95"
          num="118" unit="ms"
          delta="Groq LPU"
          data={[200,180,160,150,140,130,125,122,120,119,118,118,118,118]}
          up
        />
        <MetricTile
          label="Tokens / session"
          num="~4"
          unit="K"
          delta="moy."
          data={[1,2,3,3,4,5,5,6,7,8,9,4,4,4]}
        />
      </div>

      {/* Two-column */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
        {/* Activity */}
        <section className="card card-shine" style={{ padding: 0, overflow: "hidden" }}>
          <SectionHeader title="Activité" sub="Sessions récentes">
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--text-1)", background: "var(--surface-1)" }}>24h</button>
          </SectionHeader>
          <div style={{ padding: "8px 24px 24px" }}>
            <BarChart/>
          </div>
          <div className="divider"/>
          <div style={{ padding: "8px 4px 12px" }}>
            {[
              { t: "maintenant", ic: "sparkles", label: "Groq · llama-3.3-70b actif", meta: "connexion établie · prêt", tag: "ok" },
              { t: "récent",     ic: "key",      label: "Clés API configurées",       meta: `${totalKeys} clé${totalKeys !== 1 ? 's' : ''} dans le vault Supabase`, tag: "info" },
              { t: "récent",     ic: "folder",   label: "Projets chargés",            meta: `${activeProjects.length} projet${activeProjects.length !== 1 ? 's' : ''} actif${activeProjects.length !== 1 ? 's' : ''}`, tag: "ok" },
              { t: "session",    ic: "cpu",      label: "Modèle Groq sélectionné",    meta: "llama-3.3-70b-versatile · LPU", tag: "info" },
            ].map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "80px 24px 1fr auto",
                alignItems: "center", gap: 12, padding: "9px 24px",
              }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{row.t}</span>
                <span style={{
                  width: 24, height: 24, display: "grid", placeItems: "center",
                  borderRadius: 6, background: "var(--surface-1)",
                  color: row.tag === "warn" ? "var(--warn)" : row.tag === "info" ? "var(--text-2)" : "var(--accent)",
                }}>
                  <Icon name={row.ic} size={12}/>
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{row.label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{row.meta}</div>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm"><Icon name="upRight" size={12}/></button>
              </div>
            ))}
          </div>
        </section>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Models */}
          <section className="card card-shine">
            <SectionHeader title="Modèles" sub="Connectés" inset/>
            <div style={{ padding: "4px 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "llama-3.3-70b",    prov: "Groq", lat: "118ms", on: true,  primary: true },
                { name: "llama-3.1-8b",     prov: "Groq", lat: "45ms",  on: true,  primary: false },
                { name: "mixtral-8x7b",     prov: "Groq", lat: "89ms",  on: true,  primary: false },
                { name: "gemma2-9b",        prov: "Groq", lat: "62ms",  on: false, primary: false },
              ].map(m => (
                <div key={m.name} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "center",
                  padding: "10px 12px", border: "1px solid var(--border-0)",
                  borderRadius: 10,
                  background: m.primary ? "var(--accent-soft)" : "var(--surface-0)",
                }}>
                  <span className={"dot " + (m.on ? "dot-on" : "")}/>
                  <div>
                    <div className="mono" style={{ fontSize: 12.5, color: m.primary ? "var(--accent)" : "var(--text-1)" }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{m.prov} · p95 {m.lat}</div>
                  </div>
                  {m.primary
                    ? <span className="pill pill-accent" style={{ height: 18, fontSize: 9.5 }}>PRIMARY</span>
                    : <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => navigate('/chat')}>Utiliser</button>
                  }
                </div>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className="card">
            <SectionHeader title="Actions rapides" inset/>
            <div style={{ padding: "0 16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { ic: "sparkles", label: "Nouveau prompt",  action: () => navigate('/chat') },
                { ic: "folder",   label: "Nouveau projet",  action: () => navigate('/projects') },
                { ic: "key",      label: "Clé API",          action: () => navigate('/settings') },
                { ic: "settings", label: "Paramètres",       action: () => navigate('/settings') },
              ].map(a => (
                <button key={a.label} className="btn"
                  style={{ height: 56, justifyContent: "flex-start", padding: 12, flexDirection: "column", alignItems: "flex-start", gap: 6, background: "var(--surface-0)" }}
                  onClick={a.action}
                >
                  <Icon name={a.ic} size={14} style={{ color: "var(--text-2)" }}/>
                  <span style={{ fontSize: 12.5 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Projects table */}
      <div style={{ marginTop: 14 }}>
        <section className="card card-shine">
          <SectionHeader
            title="Projets"
            sub={`${activeProjects.length} actif${activeProjects.length !== 1 ? 's' : ''}`}
            actions={
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>Voir tout</button>
                <button className="btn btn-sm" onClick={() => navigate('/projects')}>
                  <Icon name="plus" size={12}/><span>Nouveau</span>
                </button>
              </>
            }
          />
          <div style={{ padding: "4px 0 14px" }}>
            {/* Header row */}
            <div className="mono" style={{
              display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 80px",
              padding: "8px 24px", fontSize: 10, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--text-3)",
              borderBottom: "1px solid var(--border-0)",
            }}>
              <span>Projet</span>
              <span>Statut</span>
              <span>Langage</span>
              <span>Créé le</span>
              <span></span>
            </div>

            {projectsLoading ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                Chargement…
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: "32px 24px", textAlign: "center" }}>
                <div style={{ color: "var(--text-3)", fontSize: 13, marginBottom: 12 }}>Aucun projet pour l'instant</div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')}>
                  <Icon name="plus" size={12}/><span>Créer un projet</span>
                </button>
              </div>
            ) : (
              projects.slice(0, 6).map((p) => (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 80px",
                  padding: "12px 24px", alignItems: "center", gap: 12,
                  borderBottom: "1px solid var(--border-0)", fontSize: 13,
                  cursor: "pointer", transition: "background 100ms",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-0)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
                      {p.description ? p.description.slice(0, 50) + (p.description.length > 50 ? '…' : '') : '—'}
                    </div>
                  </div>
                  <div>
                    {p.status === 'active'
                      ? <span className="pill pill-accent" style={{ height: 18, fontSize: 9.5 }}><span className="dot dot-on" style={{ width: 4, height: 4 }}/>ACTIF</span>
                      : p.status === 'archived'
                        ? <span className="pill" style={{ height: 18, fontSize: 9.5 }}><span className="dot" style={{ width: 4, height: 4 }}/>ARCHIVÉ</span>
                        : <span className="pill" style={{ borderColor: "rgba(255,203,94,0.4)", color: "var(--warn)", height: 18, fontSize: 9.5 }}>BROUILLON</span>
                    }
                  </div>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--text-2)" }}>
                    {p.main_language || 'JS'}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); navigate(`/projects/${p.id}`) }}>
                      <Icon name="external" size={12}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
