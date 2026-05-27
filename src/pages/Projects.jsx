import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useToast } from '../components/ui/Toast'
import Icon from '../components/icons/Icon'

// ── Create project modal ───────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('JavaScript')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onCreate({ name: name.trim(), description: description.trim(), mainLanguage: language })
    setLoading(false)
    onClose()
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,2,6,0.7)", backdropFilter: "blur(8px)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{
        width: 480, background: "rgba(14,14,22,0.96)", border: "1px solid var(--border-2)",
        borderRadius: 18, padding: 28, boxShadow: "0 30px 100px -20px rgba(0,0,0,0.8)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 className="display" style={{ margin: 0, fontSize: 22 }}>Nouveau projet</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>NOM DU PROJET</div>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="mon-super-projet" autoFocus required/>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>DESCRIPTION</div>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Décrivez votre projet…" style={{ height: 'auto', padding: 12, resize: 'none' }}/>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>LANGAGE PRINCIPAL</div>
            <select className="input" value={language} onChange={e => setLanguage(e.target.value)} style={{ cursor: 'pointer' }}>
              {['JavaScript', 'TypeScript', 'Python', 'HTML/CSS', 'React', 'Vue', 'Node.js', 'Autre'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Création…' : 'Créer le projet'}
              <Icon name="plus" size={13}/>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Projects page ──────────────────────────────────────────
export default function Projects() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projects, loading, createProject, deleteProject } = useProjects(user?.id)
  const toast = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState(null)

  const filtered = (projects || []).filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        (p.description || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  async function handleCreate(payload) {
    try {
      await createProject(payload)
      toast('Projet créé', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!window.confirm('Supprimer ce projet ?')) return
    setDeleting(id)
    try {
      await deleteProject(id)
      toast('Projet supprimé', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
    setDeleting(null)
  }

  return (
    <div className="fade-in" style={{ padding: "32px var(--pad-x)", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>WORKSPACE · PROJETS</div>
          <h1 className="display" style={{ margin: 0, fontSize: 38, lineHeight: 1.05 }}>Projets</h1>
          <div style={{ color: "var(--text-2)", marginTop: 8, fontSize: 14.5 }}>
            {(projects || []).filter(p => p.status === 'active').length} projet{(projects || []).filter(p => p.status === 'active').length !== 1 ? 's' : ''} actif{(projects || []).filter(p => p.status === 'active').length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={14}/><span>Nouveau projet</span>
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", border: "1px solid var(--border-1)", borderRadius: 10, height: 36, background: "var(--surface-0)", flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={13} style={{ color: "var(--text-3)" }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un projet…"
            style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-1)", fontSize: 13, flex: 1, fontFamily: "DM Sans" }}
          />
          {search && <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 20, height: 20 }} onClick={() => setSearch('')}><Icon name="x" size={11}/></button>}
        </div>
        {['all', 'active', 'archived'].map(f => (
          <button
            key={f}
            className={"btn btn-sm" + (filter === f ? "" : " btn-ghost")}
            style={filter === f ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-soft)" } : {}}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Archivés'}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 64, color: "var(--text-3)" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 24px", textAlign: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--surface-1)", border: "1px solid var(--border-1)", display: "grid", placeItems: "center", color: "var(--text-3)" }}>
            <Icon name="folder" size={24}/>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
              {search ? `Aucun résultat pour « ${search} »` : 'Aucun projet pour l\'instant'}
            </div>
            <div style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 20 }}>
              {search ? 'Essayez un autre terme de recherche' : 'Créez votre premier projet pour commencer'}
            </div>
            {!search && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Icon name="plus" size={14}/><span>Créer un projet</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {filtered.map(p => (
            <div
              key={p.id}
              className="card card-shine"
              style={{ padding: 20, cursor: "pointer", transition: "border-color 120ms" }}
              onClick={() => navigate(`/projects/${p.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-1)'}
            >
              {/* Project header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-1)", border: "1px solid var(--border-1)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
                    <Icon name="folder" size={17}/>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{p.main_language || 'JS'}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {p.status === 'active'
                    ? <span className="pill pill-accent" style={{ height: 18, fontSize: 9.5 }}><span className="dot dot-on" style={{ width: 4, height: 4 }}/>ACTIF</span>
                    : <span className="pill" style={{ height: 18, fontSize: 9.5 }}>ARCHIVÉ</span>
                  }
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, minHeight: 38, marginBottom: 16 }}>
                {p.description || <span style={{ color: "var(--text-4)" }}>Aucune description</span>}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--border-0)" }}>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>
                  {new Date(p.created_at).toLocaleDateString('fr-FR')}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Ouvrir"
                    onClick={e => { e.stopPropagation(); navigate(`/projects/${p.id}`) }}
                  >
                    <Icon name="external" size={12}/>
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Supprimer"
                    style={{ color: "var(--danger)", opacity: deleting === p.id ? 0.5 : 1 }}
                    onClick={e => handleDelete(p.id, e)}
                    disabled={deleting === p.id}
                  >
                    <Icon name="trash" size={12}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate}/>
      )}
    </div>
  )
}
