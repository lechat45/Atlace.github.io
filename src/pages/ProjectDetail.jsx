import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useToast } from '../components/ui/Toast'
import { askAIStream, getActiveModel } from '../lib/ai'
import { diffLines, countChanges, hasDiff } from '../lib/diff'
import JSZip from 'jszip'
import CodeEditor from '../components/editor/CodeEditor'
import FileTabsBar from '../components/editor/FileTabsBar'
import CodePreview from '../components/editor/CodePreview'
import AIChat from '../components/ai/AIChat'
import AgentPanel from '../components/ai/AgentPanel'
import Icon from '../components/icons/Icon'

const STARTER_FILES = {
  'HTML/JS/CSS': [
    { filename: 'index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mon App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>👋 Hello ATLACE!</h1>
    <p>Modifiez ce fichier pour commencer.</p>
    <button id="btn">Cliquez-moi</button>
    <p id="counter" class="counter">0 clics</p>
  </div>
  <script src="script.js"></script>
</body>
</html>` },
    { filename: 'style.css', language: 'css', content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: #fff;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.container { text-align: center; padding: 2rem; }
h1 { font-size: 2.5rem; margin-bottom: 1rem; }
p  { font-size: 1.1rem; color: #aaa; margin-bottom: 1.5rem; }
button {
  background: #c8ff4d; color: #0a0d04; border: none;
  padding: .75rem 2rem; border-radius: 99px;
  font-size: 1rem; font-weight: 700; cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
button:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(200,255,77,.4); }
.counter { font-size: 2rem; font-weight: 700; color: #c8ff4d; margin-top: 1rem; }` },
    { filename: 'script.js', language: 'javascript', content: `let count = 0;
const btn     = document.getElementById('btn');
const counter = document.getElementById('counter');

btn.addEventListener('click', () => {
  count++;
  counter.textContent = count + ' clic' + (count > 1 ? 's' : '');
  btn.textContent = count === 1 ? 'Encore !' : '+ Encore !';
});

console.log('✓ Script chargé');` },
  ],
  Python: [
    { filename: 'main.py', language: 'python', content: `# ── ATLACE · Python Starter ──────────────────
def saluer(nom):
    """Retourne un message de bienvenue."""
    return f"Bonjour, {nom} ! 👋"

noms = ["Alice", "Bob", "Charlie"]
for nom in noms:
    print(saluer(nom))

# Calcul simple
total = sum(range(1, 11))
print(f"\\nSomme de 1 à 10 = {total}")

# Compréhension de liste
carres = [x**2 for x in range(1, 6)]
print(f"Carrés : {carres}")
` },
  ],
  'Node.js': [
    { filename: 'index.js', language: 'javascript', content: `// ── ATLACE · Node.js Starter ────────────────
const { EventEmitter } = require('events');

class Compteur extends EventEmitter {
  constructor() { super(); this.valeur = 0; }
  incrementer(n = 1) {
    this.valeur += n;
    this.emit('changement', this.valeur);
  }
}

const c = new Compteur();
c.on('changement', v => console.log(\`Compteur : \${v}\`));

c.incrementer();
c.incrementer(4);
c.incrementer(10);

// Async / await
async function attendre(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('Début async…');
  await attendre(100);
  console.log('Terminé !');
})();
` },
  ],
  Canvas: [
    { filename: 'index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Canvas Game</title>
  <style>
    body { margin:0; background:#111; display:flex; align-items:center; justify-content:center; height:100vh; }
    canvas { border-radius:12px; box-shadow:0 0 40px rgba(200,255,77,.3); }
  </style>
</head>
<body>
<canvas id="c" width="600" height="400"></canvas>
<script src="game.js"></script>
</body>
</html>` },
    { filename: 'game.js', language: 'javascript', content: `const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const balls = Array.from({length: 8}, () => ({
  x: Math.random()*W, y: Math.random()*H,
  vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4,
  r: 10+Math.random()*20,
  color: \`hsl(\${Math.random()*360},80%,60%)\`,
}));

function update() {
  balls.forEach(b => {
    b.x += b.vx; b.y += b.vy;
    if (b.x-b.r < 0 || b.x+b.r > W) b.vx *= -1;
    if (b.y-b.r < 0 || b.y+b.r > H) b.vy *= -1;
  });
}

function draw() {
  ctx.fillStyle = 'rgba(10,10,20,.2)';
  ctx.fillRect(0,0,W,H);
  balls.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 15;
    ctx.fill();
  });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();
console.log('🎮 Canvas game lancé !');` },
  ],
  'Three.js': [
    { filename: 'index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Three.js</title>
  <style>body{margin:0;overflow:hidden;background:#000;}</style>
</head>
<body>
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js"}}</script>
<script type="module" src="main.js"></script>
</body>
</html>` },
    { filename: 'main.js', language: 'javascript', content: `import * as THREE from 'three';

const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, .1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Cube
const geo = new THREE.BoxGeometry(1,1,1);
const mat = new THREE.MeshPhongMaterial({ color: 0xc8ff4d, shininess: 100 });
const cube = new THREE.Mesh(geo, mat);
scene.add(cube);

// Lights
scene.add(new THREE.AmbientLight(0x404040));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

camera.position.z = 3;

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

(function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
})();` },
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

// ── Generate modal ─────────────────────────────────────────
function GenerateModal({ onClose, onInsert, activeFile, project }) {
  const [prompt,     setPrompt]     = useState('')
  const [result,     setResult]     = useState('')
  const [generating, setGenerating] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    if (resultRef.current) resultRef.current.scrollTop = resultRef.current.scrollHeight
  }, [result])

  async function generate() {
    if (!prompt.trim() || generating) return
    setResult('')
    setGenerating(true)
    const lang = activeFile?.language || 'javascript'
    const sysPrompt =
      `Tu es un expert développeur ${lang}. Tu génères du code de qualité professionnelle.\n` +
      `PROJET: ${project?.name || 'sans nom'} (${project?.main_language || lang})\n` +
      `FICHIER: ${activeFile?.filename || 'nouveau fichier'} (${lang})\n\n` +
      `RÈGLES ABSOLUES:\n` +
      `1. Réponds UNIQUEMENT avec un bloc \`\`\`${lang}\\n...code...\\n\`\`\`\n` +
      `2. Code COMPLET et FONCTIONNEL, pas de "..." ni de placeholders\n` +
      `3. ZÉRO texte avant ou après le bloc de code\n` +
      (activeFile?.content?.trim()
        ? `\nCONTENU ACTUEL DU FICHIER:\n\`\`\`${lang}\n${activeFile.content.slice(0, 1500)}\n\`\`\``
        : '')
    try {
      await askAIStream(sysPrompt, [], prompt, getActiveModel(), (_tok, full) => {
        setResult(full)
      }, { temperature: 0, maxTokens: 4096 })
    } catch (err) {
      setResult('❌ Erreur : ' + (err.message || String(err)))
    }
    setGenerating(false)
  }

  // Extract code from a markdown code block if present, else return raw
  function extractCode(text) {
    const m = text.match(/```(?:\w+)?\n?([\s\S]*?)```/)
    return m ? m[1].trimEnd() : text.trim()
  }

  const code      = extractCode(result)
  const hasResult = result.trim().length > 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,2,6,0.82)', backdropFilter: 'blur(10px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ width: 640, maxWidth: '96vw', background: 'rgba(10,10,18,0.98)', border: '1px solid var(--border-2)', borderRadius: 20, padding: '26px 28px', boxShadow: '0 40px 120px rgba(0,0,0,0.85)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid rgba(200,255,77,0.3)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
              <Icon name="wand" size={16}/>
            </div>
            <div>
              <h2 className="display" style={{ margin: 0, fontSize: 18 }}>Générer du code</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {activeFile?.filename || 'nouveau fichier'}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        {/* Prompt input */}
        <div style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>DÉCRIS CE QUE TU VEUX CRÉER</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              className="input"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ex : Ajoute une fonction qui trie un tableau par date…"
              rows={2}
              autoFocus
              style={{ flex: 1, resize: 'none', height: 'auto', fontSize: 13 }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate() }}
            />
            <button
              className="btn btn-primary"
              onClick={generate}
              disabled={generating || !prompt.trim()}
              style={{ alignSelf: 'flex-end', height: 38, paddingLeft: 16, paddingRight: 16, gap: 6 }}
            >
              {generating
                ? <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#0a0d04', animation: 'spin 0.6s linear infinite' }}/>
                : <><Icon name="zap" size={13}/> Générer</>
              }
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5 }}>⌘↵ pour générer · L'IA voit le contenu actuel du fichier</div>
        </div>

        {/* Streaming result */}
        {(hasResult || generating) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="eyebrow">RÉSULTAT</div>
              {generating && (
                <span style={{ fontSize: 10, color: 'var(--accent)' }} className="mono">
                  ● streaming…
                </span>
              )}
            </div>
            <div ref={resultRef} style={{ background: '#07070f', border: '1px solid var(--border-1)', borderRadius: 10, maxHeight: 300, overflowY: 'auto' }}>
              <pre className="mono" style={{ margin: 0, padding: '12px 14px', fontSize: 12, lineHeight: 1.75, color: 'var(--text-1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {result}
                {generating && (
                  <span style={{ display: 'inline-block', width: 7, height: 14, background: 'var(--accent)', borderRadius: 2, verticalAlign: 'text-bottom', marginLeft: 2, animation: 'pulseDot 0.7s ease-in-out infinite' }}/>
                )}
              </pre>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {hasResult && !generating && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
            <button className="btn btn-sm" onClick={() => { onInsert(code, 'append'); onClose() }}>
              <Icon name="arrowDown" size={12}/> Ajouter à la fin
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { onInsert(code, 'replace'); onClose() }}>
              <Icon name="check" size={12}/> Remplacer le fichier
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Inline diff viewer (shown inside the code editor area) ─
function compressDiffEqual(diff) {
  const chunks = []
  let i = 0
  while (i < diff.length) {
    if (diff[i].type === 'equal') {
      let j = i
      while (j < diff.length && diff[j].type === 'equal') j++
      const len = j - i
      if (len > 6) {
        chunks.push(...diff.slice(i, i + 3))
        chunks.push({ type: '_collapse', count: len - 6 })
        chunks.push(...diff.slice(j - 3, j))
      } else {
        chunks.push(...diff.slice(i, j))
      }
      i = j
    } else {
      chunks.push(diff[i])
      i++
    }
  }
  return chunks
}

function InlineDiffView({ oldContent, newContent }) {
  const diff   = diffLines(oldContent, newContent)
  const chunks = compressDiffEqual(diff)
  const { added, deleted } = countChanges(diff)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0c0c18', fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: 13, lineHeight: '22px' }}>
      {/* Stats bar */}
      <div style={{ padding: '4px 16px', borderBottom: '1px solid var(--border-0)', display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(255,255,255,0.025)', flexShrink: 0, position: 'sticky', top: 0 }}>
        <span style={{ color: '#86efac', fontWeight: 700 }}>+{added} lignes</span>
        <span style={{ color: '#fca5a5', fontWeight: 700 }}>−{deleted} lignes</span>
        <span style={{ color: 'var(--text-4)', fontSize: 11 }}>Modification proposée par l'Agent IA</span>
      </div>
      {/* Diff lines */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {chunks.map((c, k) => {
          if (c.type === '_collapse') {
            return (
              <div key={k} style={{ padding: '2px 16px', fontSize: 11, color: 'var(--text-4)', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', userSelect: 'none' }}>
                ⋯ {c.count} lignes inchangées
              </div>
            )
          }
          const bg      = c.type === 'add' ? 'rgba(34,197,94,0.11)' : c.type === 'del' ? 'rgba(239,68,68,0.11)' : 'transparent'
          const color   = c.type === 'add' ? '#86efac'              : c.type === 'del' ? '#fca5a5'              : '#c9d1d9'
          const prefix  = c.type === 'add' ? '+'                    : c.type === 'del' ? '−'                    : ' '
          const leftBar = c.type === 'add' ? '3px solid #22c55e'    : c.type === 'del' ? '3px solid #ef4444'    : '3px solid transparent'
          return (
            <div key={k} style={{ display: 'flex', background: bg, borderLeft: leftBar, minHeight: 22, alignItems: 'baseline' }}>
              <span style={{ minWidth: 26, textAlign: 'center', color, fontSize: 12, opacity: c.type === 'equal' ? 0.3 : 0.85, userSelect: 'none', flexShrink: 0, paddingTop: 1 }}>{prefix}</span>
              <pre style={{ margin: 0, color, flex: 1, padding: '0 8px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>{c.line}</pre>
            </div>
          )
        })}
        {!hasDiff(diff) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'var(--text-4)', fontSize: 13 }}>
            Aucun changement détecté
          </div>
        )}
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
  const [showGenerate, setShowGenerate] = useState(false)
  const [search, setSearch] = useState('')
  const [pendingChanges, setPendingChanges] = useState([]) // [{filename, oldContent, newContent}]
  const uploadRef    = useRef(null)
  const autoSaveTimer = useRef(null)
  const isDragging   = useRef(false)
  const dragOrigin   = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const rightPanelRef = useRef(null)
  const aiChatRef    = useRef(null)

  // ── Export project as ZIP ─────────────────────────────────
  async function exportZip() {
    try {
      const zip    = new JSZip()
      const folder = zip.folder(project.name || 'projet')
      files.forEach(f => folder.file(f.filename, f.content || ''))
      const blob = await zip.generateAsync({ type: 'blob' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${project.name || 'projet'}.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast('Export ZIP téléchargé ✓', 'success')
    } catch (err) { toast('Erreur export : ' + err.message, 'error') }
  }

  // ── Agent: update files after accept ─────────────────────
  async function handleAgentFilesChange(newFiles) {
    for (const f of newFiles) {
      const old = files.find(o => o.id === f.id && o.filename === f.filename)
      if (!old) {
        // New file created by agent — save to DB
        try {
          const saved = await saveFile(id, { filename: f.filename, language: f.language, content: f.content })
          newFiles = newFiles.map(nf => nf.id === f.id ? saved : nf)
        } catch {}
      } else if (old.content !== f.content) {
        // Updated file — save to DB
        try { await saveFile(id, { fileId: f.id, content: f.content }) } catch {}
      }
    }
    setFiles(newFiles)
    const updated = newFiles.find(f => f.id === activeFile?.id || f.filename === activeFile?.filename)
    if (updated) setActiveFile(updated)
    toast('Modifications appliquées ✓', 'success')
  }

  // ── Open AI panel and send a message ──────────────────────
  function triggerAI(msg) {
    setRightPanel('ai')
    setTimeout(() => aiChatRef.current?.sendMessage(msg), 80)
  }

  // ── Handle code generated in GenerateModal ─────────────────
  function handleGenerated(code, mode) {
    if (!activeFile) return
    const newContent = mode === 'replace'
      ? code
      : (activeFile.content || '') + '\n\n' + code
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: newContent } : f))
    setActiveFile(prev => ({ ...prev, content: newContent }))
    toast(mode === 'replace' ? 'Fichier remplacé ✓' : 'Code ajouté ✓', 'success')
  }

  // ── Fix errors from console via AI ────────────────────────
  function handleAIFix(errorText) {
    const code = activeFile?.content || ''
    const msg = `J'ai ces erreurs dans ma console :\n\`\`\`\n${errorText}\n\`\`\`\n\nVoici mon code (${activeFile?.filename || 'fichier'}) :\n\`\`\`${activeFile?.language || ''}\n${code.slice(0, 3000)}\n\`\`\`\n\nCorrige ces erreurs et donne-moi le fichier complet corrigé.`
    triggerAI(msg)
  }

  // ── Agent proposed changes ────────────────────────────────
  function onProposedChanges(changes) {
    setPendingChanges(changes)
    // Auto-navigate to first changed file
    const first = changes[0]
    if (first) {
      const target = files.find(f => f.filename === first.filename)
      if (target) setActiveFile(target)
    }
  }

  async function acceptChange(filename) {
    const change = pendingChanges.find(c => c.filename === filename)
    if (!change) return
    const exists = files.find(f => f.filename === filename)
    let newFiles
    if (exists) {
      newFiles = files.map(f => f.filename === filename ? { ...f, content: change.newContent } : f)
    } else {
      const ext  = filename.split('.').pop()?.toLowerCase()
      const lang = EXT_LANG[ext] || 'plaintext'
      newFiles = [...files, { id: 'agent-' + Date.now(), filename, language: lang, content: change.newContent, _new: true }]
    }
    await handleAgentFilesChange(newFiles)
    const remaining = pendingChanges.filter(c => c.filename !== filename)
    setPendingChanges(remaining)
    // Navigate to next pending file if any
    if (remaining.length > 0) {
      const nextF = newFiles.find(f => f.filename === remaining[0].filename)
      if (nextF) setActiveFile(nextF)
    }
  }

  function rejectChange(filename) {
    const remaining = pendingChanges.filter(c => c.filename !== filename)
    setPendingChanges(remaining)
    toast('Modification refusée ✗', 'success')
    // Navigate to next pending file if any
    if (remaining.length > 0) {
      const nextF = files.find(f => f.filename === remaining[0].filename)
      if (nextF) setActiveFile(nextF)
    }
  }

  async function acceptAllChanges() {
    let newFiles = [...files]
    for (const change of pendingChanges) {
      const exists = newFiles.find(f => f.filename === change.filename)
      if (exists) {
        newFiles = newFiles.map(f => f.filename === change.filename ? { ...f, content: change.newContent } : f)
      } else {
        const ext  = change.filename.split('.').pop()?.toLowerCase()
        const lang = EXT_LANG[ext] || 'plaintext'
        newFiles = [...newFiles, { id: 'agent-' + Date.now(), filename: change.filename, language: lang, content: change.newContent, _new: true }]
      }
    }
    await handleAgentFilesChange(newFiles)
    setPendingChanges([])
  }

  function rejectAllChanges() {
    setPendingChanges([])
    toast('Toutes les modifications refusées ✗', 'success')
  }

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

  // ── System prompt — budget serré pour éviter 413 ─────────
  // Max ~2 000 chars total: fichier actif (600 chars) + 2 autres (200 chars chacun)
  const systemPrompt = project ? (() => {
    const relevant = [activeFile, ...files.filter(f => f.id !== activeFile?.id)]
      .filter(Boolean).slice(0, 3)
    const fileContexts = relevant.map((f, i) => {
      const limit   = i === 0 ? 600 : 200          // active file gets more room
      const snippet = (f.content || '').slice(0, limit)
      const cut     = (f.content || '').length > limit ? '…' : ''
      return `\n### ${f.filename}\n\`\`\`${f.language || ''}\n${snippet}${cut}\n\`\`\``
    }).join('')
    return `Tu es un expert en développement pour le projet "${project.name}".
Langage : ${project.main_language || 'JavaScript'} · Fichier actif : ${activeFile?.filename || 'aucun'}
Fichiers :${fileContexts}
Réponds en français. Code complet dans des blocs markdown.`
  })() : ''

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
            onClick={exportZip}
            title="Exporter en ZIP"
          >
            <Icon name="arrowDown" size={12}/> Export ZIP
          </button>
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
              const isActive  = f.id === activeFile?.id
              const isPending = pendingChanges.some(c => c.filename === f.filename)
              return (
                <div
                  key={f.id}
                  onClick={() => setActiveFile(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                    background: isActive ? 'var(--surface-1)' : 'transparent',
                    color: isPending ? '#fbbf24' : isActive ? 'var(--text-1)' : 'var(--text-3)',
                    transition: 'all 100ms',
                    marginBottom: 1,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = isPending ? '#fcd34d' : 'var(--text-2)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = isPending ? '#fbbf24' : 'var(--text-3)' }}
                >
                  <Icon name="fileCode" size={12}/>
                  <span className="mono" style={{ fontSize: 11.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.filename}
                  </span>
                  {isPending && (
                    <div title="Modification en attente" style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, boxShadow: '0 0 6px rgba(245,158,11,0.6)' }}/>
                  )}
                  {isActive && !isPending && (
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}/>
                  )}
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

          {/* ── AI toolbar / Review toolbar ───────────────── */}
          {activeFile && (() => {
            const pending = pendingChanges.find(c => c.filename === activeFile.filename)
            if (pending) {
              // ── Review mode: accept / reject ──────────────
              const { added, deleted } = countChanges(diffLines(pending.oldContent, pending.newContent))
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderBottom: '1px solid var(--border-0)',
                  background: 'rgba(245,158,11,0.06)', flexShrink: 0,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }}/>
                  <span style={{ fontSize: 11, color: '#fbbf24', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Modification Agent IA &nbsp;·&nbsp;
                    <span style={{ color: '#86efac' }}>+{added}</span>&nbsp;
                    <span style={{ color: '#fca5a5' }}>−{deleted}</span>
                  </span>
                  {pendingChanges.length > 1 && (
                    <span style={{ fontSize: 10, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
                      {pendingChanges.length} fichiers en attente
                    </span>
                  )}
                  <div style={{ width: 1, height: 14, background: 'var(--border-1)' }}/>
                  {pendingChanges.length > 1 && (
                    <>
                      <button
                        className="btn btn-sm"
                        style={{ height: 22, fontSize: 10, gap: 4, background: 'rgba(34,197,94,0.08)', color: '#86efac', borderColor: 'rgba(34,197,94,0.3)', whiteSpace: 'nowrap' }}
                        onClick={acceptAllChanges}
                      >
                        <Icon name="check" size={10}/> Tout accepter
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ height: 22, fontSize: 10, gap: 4, background: 'rgba(239,68,68,0.08)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)', whiteSpace: 'nowrap' }}
                        onClick={rejectAllChanges}
                      >
                        <Icon name="x" size={10}/> Tout refuser
                      </button>
                      <div style={{ width: 1, height: 14, background: 'var(--border-1)' }}/>
                    </>
                  )}
                  <button
                    className="btn btn-sm"
                    style={{ height: 24, fontSize: 11, gap: 5, background: 'rgba(239,68,68,0.08)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}
                    onClick={() => rejectChange(activeFile.filename)}
                  >
                    <Icon name="x" size={11}/> Refuser
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ height: 24, fontSize: 11, gap: 5 }}
                    onClick={() => acceptChange(activeFile.filename)}
                  >
                    <Icon name="check" size={11}/> Accepter
                  </button>
                </div>
              )
            }
            // ── Normal AI toolbar ──────────────────────────
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderBottom: '1px solid var(--border-0)',
                background: 'rgba(200,255,77,0.018)', flexShrink: 0,
              }}>
                <Icon name="sparkles" size={10} style={{ color: 'var(--accent)', marginRight: 4 }}/>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ height: 22, fontSize: 11, gap: 5 }}
                  title="L'IA explique ce code étape par étape"
                  onClick={() => triggerAI('Explique ce code étape par étape en français, de manière claire et détaillée.')}
                >
                  <Icon name="bookOpen" size={11}/> Expliquer
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ height: 22, fontSize: 11, gap: 5 }}
                  title="L'IA détecte et corrige les bugs"
                  onClick={() => triggerAI('Analyse ce code attentivement. Liste tous les bugs, erreurs et problèmes potentiels, puis propose le code corrigé complet.')}
                >
                  <Icon name="bug" size={11}/> Corriger
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ height: 22, fontSize: 11, gap: 5 }}
                  title="L'IA optimise les performances et la lisibilité"
                  onClick={() => triggerAI('Optimise ce code : améliore les performances, la lisibilité et les bonnes pratiques. Donne le code amélioré complet.')}
                >
                  <Icon name="zap" size={11}/> Optimiser
                </button>
                <div style={{ width: 1, height: 14, background: 'var(--border-1)', margin: '0 2px' }}/>
                <button
                  className="btn btn-sm"
                  style={{ height: 22, fontSize: 11, gap: 5, background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'rgba(200,255,77,0.25)' }}
                  title="Génère du code avec l'IA à partir d'une description"
                  onClick={() => setShowGenerate(true)}
                >
                  <Icon name="wand" size={11}/> Générer
                </button>
              </div>
            )
          })()}

          {/* ── Editor or Diff view ───────────────────────── */}
          {pendingChanges.find(c => c.filename === activeFile?.filename)
            ? <InlineDiffView
                key={activeFile.filename}
                oldContent={pendingChanges.find(c => c.filename === activeFile.filename).oldContent}
                newContent={pendingChanges.find(c => c.filename === activeFile.filename).newContent}
              />
            : <CodeEditor file={activeFile} onChange={handleCodeChange}/>
          }
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
              <CodePreview files={files} language={project.main_language || 'HTML/JS/CSS'} onAIFix={handleAIFix}/>
            </div>
          )}
          {/* AI Chat pane */}
          {rightPanel !== 'console' && rightPanel !== 'agent' && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <AIChat
                ref={aiChatRef}
                systemPrompt={systemPrompt}
                projectName={project.name}
                onInsertCode={handleInsertCode}
              />
            </div>
          )}

          {/* Agent pane */}
          {rightPanel === 'agent' && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <AgentPanel
                files={files}
                project={project}
                onProposedChanges={onProposedChanges}
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

        {/* Agent button */}
        <button
          title="Agent IA — code autonome"
          onClick={() => setRightPanel(p => p === 'agent' ? 'split' : 'agent')}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: rightPanel === 'agent' ? 'rgba(200,255,77,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${rightPanel === 'agent' ? 'rgba(200,255,77,0.5)' : 'rgba(255,255,255,0.08)'}`,
            color: rightPanel === 'agent' ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            transition: 'all 140ms', position: 'relative',
          }}
        >
          <Icon name="wand" size={15}/>
          {/* Badge: pending count or NEW */}
          <span style={{
            position: 'absolute', top: -4, right: -4, fontSize: 7,
            background: pendingChanges.length > 0 ? '#f59e0b' : 'var(--accent)',
            color: '#050803', borderRadius: 99, padding: '1px 4px', fontWeight: 800, lineHeight: 1.4,
            minWidth: 14, textAlign: 'center',
          }}>
            {pendingChanges.length > 0 ? pendingChanges.length : 'NEW'}
          </span>
        </button>
      </div>
        </div>{/* end rightPanelRef */}
      </div>{/* end 3-column split */}

      {showNewFile && (
        <NewFileModal onClose={() => setShowNewFile(false)} onAdd={handleAddFile}/>
      )}
      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onInsert={handleGenerated}
          activeFile={activeFile}
          project={project}
        />
      )}
    </div>
  )
}
