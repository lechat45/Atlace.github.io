import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useToast } from '../components/ui/Toast'
import CodeEditor from '../components/editor/CodeEditor'
import FileTabsBar from '../components/editor/FileTabsBar'
import CodePreview from '../components/editor/CodePreview'
import AIChat from '../components/ai/AIChat'
import Icon from '../components/icons/Icon'

const STARTER_FILES = {
  'HTML/JS/CSS': [
    { filename: 'index.html', language: 'html', content: '<!DOCTYPE html>\n<html lang="fr">\n<head>\n  <meta charset="UTF-8">\n  <title>Mon App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello ATLACE!</h1>\n  <script src="script.js"></script>\n</body>\n</html>' },
    { filename: 'style.css', language: 'css', content: 'body {\n  font-family: sans-serif;\n  background: #111;\n  color: white;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  margin: 0;\n}\n\nh1 { font-size: 2rem; }' },
    { filename: 'script.js', language: 'javascript', content: 'console.log("Hello from ATLACE!");\n' },
  ],
  Python: [
    { filename: 'main.py', language: 'python', content: 'print("Hello from ATLACE!")\n\nfor i in range(5):\n    print(f"Ligne {i+1}")\n' },
  ],
  'Node.js': [
    { filename: 'index.js', language: 'javascript', content: 'console.log("Hello from ATLACE!");\n\n// Note: exécution Node.js non disponible dans le navigateur\n// Copiez ce code et exécutez avec: node index.js\n' },
  ],
}

// ── New file modal ─────────────────────────────────────────
function NewFileModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim())
  }
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,2,6,0.75)', backdropFilter: 'blur(8px)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ width: 400, background: 'rgba(14,14,22,0.97)', border: '1px solid var(--border-2)', borderRadius: 16, padding: 24, boxShadow: '0 30px 100px -20px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="display" style={{ margin: 0, fontSize: 18 }}>Nouveau fichier</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={13}/></button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>NOM DU FICHIER</div>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: component.js"
              autoFocus
              style={{ height: 38 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!name.trim()}>
              <Icon name="plus" size={12}/> Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { projects, getProjectFiles, saveFile } = useProjects(user?.id)
  const toast = useToast()
  const navigate = useNavigate()

  const project = projects.find(p => p.id === id)
  const [files, setFiles] = useState([])
  const [activeFile, setActiveFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showNewFile, setShowNewFile] = useState(false)
  const [notesContent, setNotesContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [rightPanel, setRightPanel] = useState('split') // 'split' | 'console' | 'ai'
  const [toolPos, setToolPos] = useState({ x: null, y: null })
  const uploadRef = useRef(null)
  const autoSaveTimer = useRef(null)
  const isDragging = useRef(false)
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const rightPanelRef = useRef(null)

  // ── Draggable floating toolbar (moves within right panel) ─
  useEffect(() => {
    function onMove(e) {
      if (!isDragging.current) return
      setToolPos({
        x: dragOrigin.current.px + (e.clientX - dragOrigin.current.mx),
        y: dragOrigin.current.py + (e.clientY - dragOrigin.current.my),
      })
    }
    function onUp() { isDragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  useEffect(() => {
    if (!project) return
    loadFiles()
  }, [id, project])

  async function loadFiles() {
    if (project?.type !== 'executable') return
    try {
      const dbFiles = await getProjectFiles(id)
      if (dbFiles.length === 0) {
        const lang = project.main_language || 'HTML/JS/CSS'
        const starters = STARTER_FILES[lang] || STARTER_FILES['HTML/JS/CSS']
        const created = await Promise.all(starters.map(f => saveFile(id, f)))
        setFiles(created)
        setActiveFile(created[0])
      } else {
        setFiles(dbFiles)
        setActiveFile(dbFiles[0])
      }
    } catch (err) {
      toast(`Erreur chargement: ${err.message}`, 'error')
    }
  }

  const handleCodeChange = useCallback((value) => {
    if (!activeFile) return
    const v = value || ''
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: v } : f))
    setActiveFile(prev => ({ ...prev, content: v }))
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => saveCurrentFile(activeFile.id, v), 2000)
  }, [activeFile])

  async function saveCurrentFile(fileId, content) {
    try { await saveFile(id, { fileId, content }) }
    catch (err) { toast(`Erreur sauvegarde: ${err.message}`, 'error') }
  }

  async function handleSave() {
    if (!activeFile) return
    setSaving(true)
    try {
      await saveFile(id, { fileId: activeFile.id, content: activeFile.content })
      toast('Sauvegardé ✓', 'success')
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  const EXT_LANG = {
    html: 'html', htm: 'html', css: 'css', scss: 'css', sass: 'css', less: 'css',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', json: 'json', md: 'markdown', txt: 'plaintext',
    vue: 'html', svelte: 'html', php: 'php', rb: 'ruby', go: 'go', rs: 'rust',
    java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp', sh: 'shell', yaml: 'yaml', yml: 'yaml',
  }

  async function handleAddFile(filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    const language = EXT_LANG[ext] || 'plaintext'
    try {
      const f = await saveFile(id, { filename, language, content: '' })
      setFiles(prev => [...prev, f])
      setActiveFile(f)
      setShowNewFile(false)
    } catch (err) { toast(err.message, 'error') }
  }

  async function handleUpload(e) {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return
    setUploading(true)
    let lastFile = null
    let count = 0
    try {
      for (const file of picked) {
        const text = await file.text()
        const ext = file.name.split('.').pop()?.toLowerCase()
        const language = EXT_LANG[ext] || 'plaintext'
        // Check if a file with this name already exists → update it
        const existing = files.find(f => f.filename === file.name)
        if (existing) {
          await saveFile(id, { fileId: existing.id, content: text })
          setFiles(prev => prev.map(f => f.id === existing.id ? { ...f, content: text } : f))
          lastFile = { ...existing, content: text }
        } else {
          const saved = await saveFile(id, { filename: file.name, language, content: text })
          setFiles(prev => [...prev, saved])
          lastFile = saved
        }
        count++
      }
      setActiveFile(lastFile)
      toast(count === 1 ? `"${lastFile.filename}" importé ✓` : `${count} fichiers importés ✓`, 'success')
    } catch (err) {
      toast(`Erreur import: ${err.message}`, 'error')
    }
    setUploading(false)
    // Reset input so the same file can be re-uploaded
    e.target.value = ''
  }

  function handleInsertCode(code) {
    if (!activeFile) return
    const newContent = (activeFile.content || '') + '\n' + code
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: newContent } : f))
    setActiveFile(prev => ({ ...prev, content: newContent }))
    toast('Code inséré ✓', 'success')
  }

  const systemPrompt = project
    ? `Tu es un assistant IA pour le projet "${project.name}". ${project.description ? 'Description: ' + project.description + '.' : ''} Fichier actif: ${activeFile?.filename || 'aucun'}.\n\nContenu:\n\`\`\`\n${activeFile?.content?.slice(0, 2000) || ''}\n\`\`\``
    : ''

  // ── Loading state ──────────────────────────────────────
  if (!project) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }}/>
      </div>
    )
  }

  // ── External project ───────────────────────────────────
  if (project.type === 'external') {
    return (
      <div className="fade-in" style={{ padding: '32px var(--pad-x)', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/projects')}>
            <Icon name="chevronR" size={14} style={{ transform: 'rotate(180deg)' }}/>
          </button>
          <div>
            <div className="eyebrow" style={{ marginBottom: 3 }}>PROJET EXTERNE</div>
            <h1 className="display" style={{ margin: 0, fontSize: 26 }}>{project.name}</h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>INFORMATIONS</div>
            <p style={{ color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>
              {project.description || 'Aucune description'}
            </p>
            {project.external_url && (
              <a href={project.external_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  <Icon name="globe" size={13}/> Ouvrir le projet <Icon name="external" size={12}/>
                </button>
              </a>
            )}
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>NOTES</div>
            <textarea
              value={notesContent}
              onChange={e => setNotesContent(e.target.value)}
              placeholder="Ajoutez vos notes ici…"
              rows={6}
              className="input"
              style={{ height: 'auto', resize: 'none', fontSize: 13 }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Executable project ─────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Project topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 44, borderBottom: '1px solid var(--border-0)',
        background: 'rgba(255,255,255,0.015)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => navigate('/projects')}>
            <Icon name="chevronR" size={13} style={{ transform: 'rotate(180deg)' }}/>
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--border-1)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent-soft)', border: '1px solid rgba(200,255,77,0.25)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
              <Icon name="folder" size={11}/>
            </div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{project.name}</span>
            <span className="pill" style={{ height: 16, fontSize: 9 }}>{project.main_language || 'JS'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeFile && (
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
              {activeFile.filename}
            </span>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            title="Téléverser des fichiers"
          >
            {uploading
              ? <div style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }}/>
              : <Icon name="upload" size={12}/>
            }
            {uploading ? 'Import…' : 'Importer'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSave}
            disabled={saving || !activeFile}
          >
            <Icon name="save" size={12}/>
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* 3-column split: file tree | editor | preview+AI */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: file list */}
        <div style={{
          width: 200, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--border-0)',
          background: 'rgba(255,255,255,0.01)', flexShrink: 0,
        }}>
          {/* hidden file input */}
          <input
            ref={uploadRef}
            type="file"
            multiple
            accept=".html,.htm,.css,.scss,.sass,.less,.js,.jsx,.mjs,.ts,.tsx,.py,.json,.md,.txt,.vue,.svelte,.php,.rb,.go,.rs,.java,.c,.cpp,.cs,.sh,.yaml,.yml"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="eyebrow" style={{ fontSize: 9 }}>FICHIERS</span>
            <div style={{ display: 'flex', gap: 3 }}>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                style={{ width: 22, height: 22 }}
                title="Téléverser des fichiers"
                onClick={() => uploadRef.current?.click()}
                disabled={uploading}
              >
                {uploading
                  ? <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }}/>
                  : <Icon name="upload" size={11}/>
                }
              </button>
              <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 22, height: 22 }} title="Nouveau fichier" onClick={() => setShowNewFile(true)}>
                <Icon name="plus" size={11}/>
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
            {files.map(f => {
              const isActive = f.id === activeFile?.id
              return (
                <div
                  key={f.id}
                  onClick={() => setActiveFile(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                    background: isActive ? 'var(--surface-1)' : 'transparent',
                    color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                    transition: 'all 100ms',
                    marginBottom: 1,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-2)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-3)' }}
                >
                  <Icon name="fileCode" size={12}/>
                  <span className="mono" style={{ fontSize: 11.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.filename}
                  </span>
                  {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}/>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Center: Monaco editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--border-0)' }}>
          <FileTabsBar
            files={files}
            activeFileId={activeFile?.id}
            onSelect={setActiveFile}
            onNewFile={() => setShowNewFile(true)}
          />
          <CodeEditor file={activeFile} onChange={handleCodeChange}/>
        </div>

        {/* Right: preview / AI (controlled by floating toolbar) */}
        <div ref={rightPanelRef} style={{ width: 340, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative' }}>
          {/* Console/Preview pane */}
          {rightPanel !== 'ai' && (
            <div style={{
              flex: rightPanel === 'console' ? 1 : '0 0 50%',
              borderBottom: rightPanel === 'split' ? '1px solid var(--border-0)' : 'none',
              overflow: 'hidden',
            }}>
              <CodePreview files={files} language={project.main_language || 'HTML/JS/CSS'}/>
            </div>
          )}
          {/* AI Chat pane */}
          {rightPanel !== 'console' && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <AIChat
                systemPrompt={systemPrompt}
                projectName={project.name}
                onInsertCode={handleInsertCode}
              />
            </div>
          )}

          {/* ── Floating draggable toolbar — INSIDE right panel ─ */}
      <div
        style={{
          position: 'absolute',
          left:   toolPos.x !== null ? toolPos.x : '50%',
          bottom: toolPos.y !== null ? undefined : 14,
          top:    toolPos.y !== null ? toolPos.y : undefined,
          transform: toolPos.x === null ? 'translateX(-50%)' : undefined,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          background: '#06060c',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '5px 6px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={e => {
          if (e.target.closest('button')) return
          const container = rightPanelRef.current
          const toolbar = e.currentTarget
          const cr = container ? container.getBoundingClientRect() : { left: 0, top: 0, width: 340, height: 600 }
          const tr = toolbar.getBoundingClientRect()
          isDragging.current = true
          dragOrigin.current = {
            mx: e.clientX,
            my: e.clientY,
            // current top-left of toolbar relative to container
            px: toolPos.x !== null ? toolPos.x : tr.left - cr.left,
            py: toolPos.y !== null ? toolPos.y : tr.top  - cr.top,
          }
          e.preventDefault()
        }}
      >
        {/* Drag grip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 4px', opacity: 0.3, pointerEvents: 'none' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 14, height: 1.5, background: 'white', borderRadius: 99 }}/>)}
        </div>

        {/* Console button */}
        <button
          title="Console / Rendu"
          onClick={() => setRightPanel(p => p === 'console' ? 'split' : 'console')}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: rightPanel === 'console' ? 'rgba(200,255,77,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${rightPanel === 'console' ? 'rgba(200,255,77,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: rightPanel === 'console' ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            transition: 'all 140ms',
          }}
        >
          <Icon name="terminal" size={15}/>
        </button>

        {/* AI Chat button */}
        <button
          title="Chat IA"
          onClick={() => setRightPanel(p => p === 'ai' ? 'split' : 'ai')}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: rightPanel === 'ai' ? 'rgba(200,255,77,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${rightPanel === 'ai' ? 'rgba(200,255,77,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: rightPanel === 'ai' ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            transition: 'all 140ms',
          }}
        >
          <Icon name="sparkles" size={15}/>
        </button>
      </div>
        </div>{/* end rightPanelRef */}
      </div>{/* end 3-column split */}

      {showNewFile && (
        <NewFileModal onClose={() => setShowNewFile(false)} onAdd={handleAddFile}/>
      )}
    </div>
  )
}
