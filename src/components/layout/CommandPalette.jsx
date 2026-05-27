import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { inputRef.current?.focus() }
    else { setQ("") }
  }, [open])

  const items = useMemo(() => [
    { group: "Navigation", icon: "dashboard", label: "Aller au Dashboard",   hint: "↵", run: () => navigate('/dashboard') },
    { group: "Navigation", icon: "chat",      label: "Ouvrir Chat IA",       hint: "↵", run: () => navigate('/chat') },
    { group: "Navigation", icon: "folder",    label: "Ouvrir Projets",        hint: "↵", run: () => navigate('/projects') },
    { group: "Navigation", icon: "settings",  label: "Paramètres",            hint: "↵", run: () => navigate('/settings') },
    { group: "Actions",    icon: "plus",      label: "Nouveau projet",         hint: "↵", run: () => navigate('/projects') },
    { group: "Actions",    icon: "sparkles",  label: "Demander à l'IA…",      hint: "↵", run: () => navigate('/chat') },
    { group: "Actions",    icon: "key",       label: "Gérer les clés API",     hint: "↵", run: () => navigate('/settings') },
    { group: "Modèles",    icon: "cpu",       label: "llama-3.3-70b · Groq",  hint: "↵" },
    { group: "Modèles",    icon: "cpu",       label: "llama-3.1-8b · Groq",   hint: "↵" },
    { group: "Modèles",    icon: "cpu",       label: "mixtral-8x7b · Groq",   hint: "↵" },
  ], [navigate])

  const filtered = items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()))
  useEffect(() => { setActive(0) }, [q])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(filtered.length - 1, a + 1)) }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(0, a - 1)) }
      if (e.key === "Enter") {
        const it = filtered[active]
        if (it?.run) it.run()
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, filtered, active, onClose])

  if (!open) return null

  const grouped = filtered.reduce((acc, it) => {
    ;(acc[it.group] = acc[it.group] || []).push(it)
    return acc
  }, {})

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border-1)" }}>
          <Icon name="search" size={16} style={{ color: "var(--text-3)", flexShrink: 0 }}/>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher, naviguer, invoquer une action…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "var(--text-1)", fontSize: 15, fontFamily: "DM Sans",
            }}
          />
          <span className="kbd" style={{ marginRight: 2 }}>esc</span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: "auto", padding: 8 }}>
          {Object.entries(grouped).map(([group, list]) => (
            <div key={group} style={{ marginBottom: 4 }}>
              <div className="eyebrow" style={{ padding: "8px 10px 4px" }}>{group}</div>
              {list.map((it) => {
                const globalIdx = filtered.indexOf(it)
                return (
                  <div
                    key={it.label}
                    className="palette-row"
                    data-active={active === globalIdx ? "true" : "false"}
                    onMouseEnter={() => setActive(globalIdx)}
                    onClick={() => { it.run?.(); onClose() }}
                  >
                    <Icon name={it.icon} size={15} style={{ color: "var(--text-2)" }}/>
                    <span style={{ flex: 1, fontSize: 13.5 }}>{it.label}</span>
                    <span className="kbd">{it.hint}</span>
                  </div>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              Aucun résultat pour « {q} »
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 16px", borderTop: "1px solid var(--border-1)", color: "var(--text-3)", fontSize: 11 }}>
          <span className="mono">↑↓ naviguer</span>
          <span className="mono">↵ exécuter</span>
          <span className="mono">esc fermer</span>
          <span style={{ flex: 1 }}/>
          <span className="mono">atlace · v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
