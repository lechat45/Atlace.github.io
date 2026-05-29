import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useToast } from '../components/ui/Toast'
import Icon from '../components/icons/Icon'

/* ── Language colors ─────────────────────────────────────────── */
const LANG_COLORS = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572a5',
  'HTML/CSS': '#e34f26', React: '#61dafb', Vue: '#42b883',
  'Node.js': '#8cc84b', Autre: '#8b5cf6',
}

/* ── Create modal ─────────────────────────────────────────────── */
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,2,6,0.75)', backdropFilter: 'blur(10px)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          width: 480, background: 'rgba(12,12,20,0.98)',
          border: '1px solid var(--border-2)', borderRadius: 20,
          padding: 28, boxShadow: '0 40px 120px -20px rgba(0,0,0,0.9), 0 0 0 1px var(--border-shine) inset',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 className="display" style={{ margin: 0, fontSize: 22 }}>Nouveau projet</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>Configurez votre espace de travail</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-1)', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            <Icon name="x" size={14}/>
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 7 }}>NOM DU PROJET *</label>
            <input
              className="input" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="mon-super-projet"
              style={{ borderRadius: 10, height: 42 }}
              autoFocus required
            />
          </div>

          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 7 }}>DESCRIPTION</label>
            <textarea
              className="input" value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3} placeholder="Décrivez votre projet en quelques mots…"
              style={{ height: 'auto', padding: 12, resize: 'none', borderRadius: 10 }}
            />
          </div>

          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 7 }}>LANGAGE PRINCIPAL</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['JavaScript', 'TypeScript', 'Python', 'HTML/CSS', 'React', 'Vue', 'Node.js', 'Autre'].map(l => (
                <button
                  key={l} type="button"
                  onClick={() => setLanguage(l)}
                  style={{
                    height: 30, padding: '0 12px', borderRadius: 8,
                    border: language === l ? `1px solid ${LANG_COLORS[l]}40` : '1px solid var(--border-1)',
                    background: language === l ? `${LANG_COLORS[l]}14` : 'var(--surface-0)',
                    color: language === l ? LANG_COLORS[l] : 'var(--text-2)',
                    fontSize: 12.5, cursor: 'pointer',
                    transition: 'all 150ms',
                    fontFamily: 'Fira Code',
                  }}
                >{l}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name.trim()}
              style={{ opacity: !name.trim() ? 0.5 : 1 }}
            >
              {loading ? (
                <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--accent-ink)', animation: 'spin 0.7s linear infinite' }}/>Création…</>
              ) : (
                <><Icon name="plus" size={13}/>Créer le projet</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ── Project card ─────────────────────────────────────────────── */
function ProjectCard({ project, onOpen, onDelete, deleting }) {
  const langColor = LANG_COLORS[project.main_language] || '#8b5cf6'
  const isActive = project.status === 'active'
  const dateStr = new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -2, borderColor: 'var(--border-2)' }}
      onClick={onOpen}
      style={{
        padding: '20px', borderRadius: 14, cursor: 'pointer',
        border: '1px solid var(--border-1)',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))',
        display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative', overflow: 'hidden',
        transition: 'border-color 200ms',
      }}
    >
      {/* Top shine */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--border-shine), transparent)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: `${langColor}15`,
            border: `1px solid ${langColor}30`,
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name="folder" size={18} style={{ color: langColor }}/>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', lineHeight: 1.2 }}>{project.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: langColor, display: 'inline-block' }}/>
              <span style={{ fontFamily: 'Fira Code', fontSize: 10.5, color: 'var(--text-3)' }}>{project.main_language || 'JS'}</span>
            </div>
          </div>
        </div>
        {isActive
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Fira Code', fontSize: 9.5, color: 'var(--accent)', background: 'rgba(200,255,77,0.08)', border: '1px solid rgba(200,255,77,0.25)', padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', animation: 'pulseDot 2.5s infinite' }}/>ACTIF</span>
          : <span style={{ fontFamily: 'Fira Code', fontSize: 9.5, color: 'var(--text-4)', background: 'var(--surface-1)', border: '1px solid var(--border-0)', padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>ARCHIVÉ</span>
        }
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55, minHeight: 40 }}>
        {project.description || <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>Aucune description</span>}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-0)' }}>
        <span style={{ fontFamily: 'Fira Code', fontSize: 10.5, color: 'var(--text-4)' }}>{dateStr}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            title="Ouvrir"
            onClick={e => { e.stopPropagation(); onOpen() }}
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-1)', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-3)', transition: 'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <Icon name="external" size={12}/>
          </button>
          <button
            title="Supprimer"
            onClick={e => { e.stopPropagation(); onDelete() }}
            disabled={deleting}
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid transparent', background: 'transparent', cursor: deleting ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-4)', transition: 'all 150ms', opacity: deleting ? 0.4 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.borderColor = 'transparent' }}
          >
            <Icon name="trash" size={12}/>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Projects page ─────────────────────────────────────────────── */
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
    const q = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.main_language || '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  const activeCount = (projects || []).filter(p => p.status === 'active').length

  async function handleCreate(payload) {
    try {
      await createProject(payload)
      toast('Projet créé avec succès', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce projet ? Cette action est irréversible.')) return
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
    <div className="fade-in" style={{ padding: '24px 24px 48px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Fira Code', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
            Workspace · Projets
          </div>
          <h1 style={{ margin: 0, fontFamily: 'Syne', fontWeight: 800, fontSize: 34, lineHeight: 1.1 }}>Projets</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-3)' }}>
            {activeCount} projet{activeCount !== 1 ? 's' : ''} actif{activeCount !== 1 ? 's' : ''} · {(projects || []).length} au total
          </p>
        </div>
        <motion.button
          className="btn btn-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          style={{ flexShrink: 0 }}
        >
          <Icon name="plus" size={14}/> Nouveau projet
        </motion.button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 12px', height: 36, flex: 1, maxWidth: 300,
          border: '1px solid var(--border-1)', borderRadius: 10,
          background: 'var(--surface-0)',
          transition: 'border-color 150ms',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-1)'}
        >
          <Icon name="search" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 13, flex: 1, fontFamily: 'DM Sans' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 2 }}
            >
              <Icon name="x" size={11}/>
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 4, padding: '3px', background: 'var(--surface-0)', border: '1px solid var(--border-0)', borderRadius: 10 }}>
          {[['all', 'Tous'], ['active', 'Actifs'], ['archived', 'Archivés']].map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                height: 28, padding: '0 12px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer',
                border: filter === f ? '1px solid var(--border-2)' : '1px solid transparent',
                background: filter === f ? 'var(--surface-2)' : 'transparent',
                color: filter === f ? 'var(--text-1)' : 'var(--text-3)',
                transition: 'all 150ms',
              }}
            >{label}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', fontFamily: 'Fira Code', fontSize: 11, color: 'var(--text-4)' }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--surface-2)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }}/>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', textAlign: 'center', gap: 16 }}
        >
          <div style={{ fontSize: 48, lineHeight: 1 }}>📂</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              {search ? `Aucun résultat pour « ${search} »` : 'Aucun projet'}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text-3)', marginBottom: 20 }}>
              {search ? 'Essayez un autre terme de recherche.' : 'Créez votre premier projet pour démarrer.'}
            </div>
            {!search && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Icon name="plus" size={14}/> Créer un projet
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          layout
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}
        >
          <AnimatePresence>
            {filtered.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => navigate(`/projects/${p.id}`)}
                onDelete={() => handleDelete(p.id)}
                deleting={deleting === p.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
        )}
      </AnimatePresence>
    </div>
  )
}
