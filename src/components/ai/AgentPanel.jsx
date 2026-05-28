import { useState, useRef, useEffect } from 'react'
import { askAIStream, getActiveModel, stripThinking } from '../../lib/ai'
import { extractCode } from '../../lib/diff'
import Icon from '../icons/Icon'

// ── Parse numbered TODO list from AI plain text ────────────
function parseTodos(text) {
  return (text || '').split('\n')
    .map(line => {
      const m = line.match(/^(\d+)[.)]\s+(.+?)(?:\s*[→>]\s*(.+))?$/)
      if (!m) return null
      return {
        step:   parseInt(m[1]),
        title:  m[2].trim(),
        file:   m[3]?.trim().split(',')[0].trim() || null,
        status: 'pending', // pending | running | done | error
      }
    })
    .filter(Boolean)
}

// ── Status icon for a TODO step ────────────────────────────
function StepIcon({ status }) {
  if (status === 'running') return (
    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}/>
  )
  if (status === 'done')  return <Icon name="check" size={14} style={{ color: '#86efac', flexShrink: 0 }}/>
  if (status === 'error') return <Icon name="x"     size={14} style={{ color: '#fca5a5', flexShrink: 0 }}/>
  return <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border-2)', flexShrink: 0 }}/>
}

// ── Main component ─────────────────────────────────────────
// Props:
//   files            – current project files array
//   project          – project metadata
//   onProposedChanges(changes) – called when ALL steps are done
//     changes: [{filename, oldContent, newContent}]
export default function AgentPanel({ files, project, onProposedChanges }) {
  const [task,           setTask]           = useState('')
  const [phase,          setPhase]          = useState('idle')  // idle|planning|executing|done
  const [todos,          setTodos]          = useState([])
  const [currentStep,    setCurrentStep]    = useState(-1)
  const [generatedFiles, setGeneratedFiles] = useState([])      // [{filename, status}]
  const [streamText,     setStreamText]     = useState('')
  const [log,            setLog]            = useState([])

  const filesRef  = useRef(files)
  const cancelRef = useRef(false)

  useEffect(() => { filesRef.current = files }, [files])

  function addLog(msg, type = 'info') {
    setLog(prev => [...prev, { msg, type, ts: Date.now() + Math.random() }])
  }

  // ── Run the full agent loop ─────────────────────────────
  async function runAgent() {
    if (!task.trim() || phase !== 'idle') return
    cancelRef.current = false
    setPhase('planning')
    setTodos([]); setGeneratedFiles([]); setLog([]); setCurrentStep(-1); setStreamText('')

    const fileList = filesRef.current.map(f => `${f.filename} (${f.language || 'js'})`).join(', ')
    addLog('🧠 Analyse de la tâche…')

    // ── Phase 1 : planning ──────────────────────────────────
    const planPrompt =
      `Tu es un agent de développement expert. Planifie cette tâche.\n\n` +
      `PROJET: "${project?.name || 'sans nom'}" (${project?.main_language || 'JS'})\n` +
      `FICHIERS EXISTANTS: ${fileList}\n` +
      `TÂCHE: ${task}\n\n` +
      `INSTRUCTIONS:\n` +
      `- Réponds UNIQUEMENT avec la liste numérotée, rien d'autre\n` +
      `- 2 à 4 étapes MAX\n` +
      `- Préfère MODIFIER des fichiers existants plutôt qu'en créer de nouveaux\n` +
      `- Chaque étape = UN seul fichier modifié\n` +
      `- Format EXACT: N. [action précise] → [fichier.ext]\n\n` +
      `EXEMPLE:\n` +
      `1. Ajouter la fonction de validation au formulaire → index.html\n` +
      `2. Ajouter les styles du formulaire → style.css\n` +
      `3. Implémenter la logique de soumission → script.js`

    let planText = ''
    try {
      await askAIStream('', [], planPrompt, getActiveModel(), (_t, full) => {
        planText = full; setStreamText(full)
      }, { temperature: 0.3 })
    } catch (err) {
      addLog('❌ Erreur planification : ' + err.message, 'error')
      setPhase('idle'); return
    }

    // Strip <think> blocks from reasoning models before parsing
    const cleanPlan = stripThinking(planText)
    const parsedTodos = parseTodos(cleanPlan)
    if (parsedTodos.length === 0) {
      addLog('❌ Plan illisible — réessaie avec une description plus précise', 'error')
      setPhase('idle'); return
    }

    setTodos(parsedTodos); setStreamText('')
    addLog(`✓ Plan : ${parsedTodos.length} étape(s) — génération en cours…`)
    setPhase('executing')

    const collectedChanges = []

    // ── Phase 2 : execute ALL steps without pausing ─────────
    for (let idx = 0; idx < parsedTodos.length; idx++) {
      if (cancelRef.current) break

      const todo = parsedTodos[idx]
      setCurrentStep(idx)
      setTodos(prev => prev.map((t, i) => i === idx ? { ...t, status: 'running' } : t))
      addLog(`▶ Étape ${todo.step} : ${todo.title}`)

      const latest     = filesRef.current
      const target     = latest.find(f =>
        f.filename === todo.file ||
        f.filename.toLowerCase() === todo.file?.toLowerCase()
      )
      const oldContent = target?.content || ''

      const ext  = (todo.file || 'index.js').split('.').pop()?.toLowerCase()
      const lang = { js:'javascript', jsx:'javascript', ts:'typescript', tsx:'typescript', py:'python', css:'css', html:'html', json:'json', md:'markdown' }[ext] || ext || 'javascript'

      // Target file gets 2500 chars; other files get 120 chars each (signatures only)
      const targetContent = oldContent
      const oldLines      = oldContent ? oldContent.split('\n').length : 0
      const targetSnippet = oldContent.slice(0, 2500)
      const targetCut     = oldContent.length > 2500
        ? `\n// … (${oldContent.length - 2500} caractères supplémentaires non affichés — CONSERVE tout ce code)`
        : ''

      const otherFiles = latest
        .filter(f => f.filename !== todo.file)
        .slice(0, 3)
        .map(f => `// ${f.filename}: ${(f.content || '').slice(0, 120).replace(/\n/g, ' ')}…`)
        .join('\n')

      const stepSys =
        `Tu es un expert développeur. Tu modifies du code avec PRÉCISION CHIRURGICALE.\n\n` +
        `PROJET: "${project?.name || 'projet'}"\n` +
        `TÂCHE GLOBALE: ${task}\n` +
        `ÉTAPE ${todo.step}/${parsedTodos.length}: ${todo.title}\n` +
        `FICHIER CIBLE: ${todo.file || 'index.js'} (${lang})\n` +
        (oldLines > 0 ? `TAILLE ACTUELLE: ${oldLines} lignes\n` : '') +
        `\nFICHIER ACTUEL COMPLET:\n\`\`\`${lang}\n${targetSnippet}${targetCut}\n\`\`\`\n\n` +
        (otherFiles ? `AUTRES FICHIERS (résumé):\n${otherFiles}\n\n` : '') +
        `RÈGLES ABSOLUES — violation = réponse invalide:\n` +
        `1. Réponds UNIQUEMENT avec \`\`\`${lang}\\n...\\n\`\`\` — zéro texte avant/après\n` +
        `2. GÉNÈRE LE FICHIER ENTIER — première ligne jusqu'à la dernière\n` +
        (oldLines > 0
          ? `3. Le fichier généré doit avoir AU MOINS ${Math.floor(oldLines * 0.85)} lignes (actuel: ${oldLines}) — ne supprime pas de code existant\n`
          : `3. Code COMPLET, pas de raccourcis\n`) +
        `4. INTERDIT: "...", "// reste inchangé", "// existing code", "// TODO", résumés ou placeholders\n` +
        `5. Conserve TOUTES les fonctionnalités existantes, ajoute seulement ce qui est demandé\n` +
        `6. Code fonctionnel et sans bugs`

      let stepText = ''
      try {
        await askAIStream(
          stepSys, [],
          `Modifie ${todo.file || 'index.js'} pour: ${todo.title}. Génère le fichier complet.`,
          getActiveModel(),
          (_t, full) => { stepText = full; setStreamText(full) },
          { temperature: 0, maxTokens: 4096 }
        )
      } catch (err) {
        addLog(`❌ Étape ${todo.step} échouée : ${err.message}`, 'error')
        setTodos(prev => prev.map((t, i) => i === idx ? { ...t, status: 'error' } : t))
        setGeneratedFiles(prev => [...prev, { filename: todo.file || `step${todo.step}.js`, status: 'error' }])
        continue
      }

      setStreamText('')
      // Strip <think> reasoning blocks before extracting the code
      const newContent = extractCode(stripThinking(stepText))
      const filename   = todo.file || `step${todo.step}.js`

      // Warn if the AI truncated significantly (lost > 40% of lines)
      const newLines = newContent.split('\n').length
      if (oldLines > 20 && newLines < oldLines * 0.6) {
        addLog(`⚠ ${filename} : ${oldLines} → ${newLines} lignes (possible troncation)`, 'error')
      }

      collectedChanges.push({ filename, oldContent, newContent })
      setGeneratedFiles(prev => [...prev, { filename, status: 'done' }])
      setTodos(prev => prev.map((t, i) => i === idx ? { ...t, status: 'done' } : t))
      addLog(`✓ ${filename} — ${newLines} lignes générées`)
    }

    setPhase('done')
    setCurrentStep(-1)
    setStreamText('')

    if (!cancelRef.current && collectedChanges.length > 0) {
      addLog(`📋 ${collectedChanges.length} fichier(s) prêt(s) — révise dans l'éditeur`)
      onProposedChanges?.(collectedChanges)
    } else if (cancelRef.current) {
      addLog('⚠ Annulé par l\'utilisateur')
    } else {
      addLog('⚠ Aucun fichier généré', 'error')
    }
  }

  function reset() {
    cancelRef.current = true
    setTimeout(() => {
      cancelRef.current = false
      setPhase('idle'); setTask(''); setTodos([]); setGeneratedFiles([])
      setLog([]); setCurrentStep(-1); setStreamText('')
    }, 50)
  }

  const isRunning = phase === 'planning' || phase === 'executing'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-deep)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--border-0)', background: 'rgba(255,255,255,0.015)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="wand" size={13} style={{ color: 'var(--accent)' }}/>
          <span className="eyebrow" style={{ fontSize: 10 }}>AGENT IA</span>
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: 'rgba(200,255,77,0.12)', color: 'var(--accent)', border: '1px solid rgba(200,255,77,0.3)', fontWeight: 700 }}>BÊTA</span>
        </div>
        {(isRunning || phase === 'done') && (
          <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 11 }} onClick={reset}>
            <Icon name="refresh" size={11}/> Réinitialiser
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Task input (idle only) ────────────────────────── */}
        {phase === 'idle' && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>QUE DOIS-JE FAIRE ?</div>
            <textarea
              className="input"
              value={task}
              onChange={e => setTask(e.target.value)}
              placeholder={"Ex : Ajoute un formulaire de contact avec validation\nEx : Crée un système de panier d'achat\nEx : Ajoute un mode sombre à l'application"}
              rows={4}
              style={{ resize: 'none', height: 'auto', fontSize: 12.5, lineHeight: 1.6 }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runAgent() }}
            />
            <button
              className="btn btn-primary"
              onClick={runAgent}
              disabled={!task.trim()}
              style={{ width: '100%', marginTop: 10, justifyContent: 'center', gap: 7, height: 38 }}
            >
              <Icon name="wand" size={14}/> Lancer l'agent ⌘↵
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
              L'IA code <strong style={{ color: 'var(--text-3)' }}>toutes les étapes</strong> d'un coup,<br/>
              puis tu révises les <span style={{ color: '#86efac' }}>✚</span>/<span style={{ color: '#fca5a5' }}>✖</span> dans l'éditeur.
            </p>
          </div>
        )}

        {/* ── TODO plan ─────────────────────────────────────── */}
        {todos.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>PLAN D'ACTION</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {todos.map((todo, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px',
                  borderRadius: 9,
                  background: currentStep === i ? 'rgba(200,255,77,0.06)' : 'var(--surface-0)',
                  border: `1px solid ${currentStep === i ? 'rgba(200,255,77,0.2)' : 'var(--border-0)'}`,
                  transition: 'all 150ms',
                }}>
                  <StepIcon status={todo.status}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: todo.status === 'done' ? 'var(--text-3)' : 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {todo.step}. {todo.title}
                    </div>
                    {todo.file && (
                      <div className="mono" style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>{todo.file}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Streaming preview ─────────────────────────────── */}
        {streamText && (
          <div style={{ borderRadius: 10, border: '1px solid rgba(200,255,77,0.2)', background: 'rgba(200,255,77,0.03)', overflow: 'hidden' }}>
            <div style={{ padding: '5px 10px', borderBottom: '1px solid rgba(200,255,77,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulseDot 0.8s ease-in-out infinite' }}/>
              <span className="eyebrow" style={{ fontSize: 9, color: 'var(--accent)' }}>EN COURS</span>
            </div>
            <pre className="mono" style={{ margin: 0, padding: '8px 10px', fontSize: 10.5, color: 'var(--text-3)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 100, overflow: 'hidden' }}>
              {streamText.slice(-400)}
              <span style={{ display: 'inline-block', width: 6, height: 12, background: 'var(--accent)', borderRadius: 2, verticalAlign: 'text-bottom', marginLeft: 2, animation: 'pulseDot 0.7s ease-in-out infinite' }}/>
            </pre>
          </div>
        )}

        {/* ── Generated files summary ───────────────────────── */}
        {generatedFiles.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>FICHIERS MODIFIÉS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {generatedFiles.map((gf, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  borderRadius: 8,
                  background: gf.status === 'done' ? 'rgba(134,239,172,0.05)' : 'rgba(252,165,165,0.05)',
                  border: `1px solid ${gf.status === 'done' ? 'rgba(134,239,172,0.2)' : 'rgba(252,165,165,0.2)'}`,
                }}>
                  <Icon name="fileCode" size={11} style={{ color: gf.status === 'done' ? '#86efac' : '#fca5a5' }}/>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)', flex: 1 }}>{gf.filename}</span>
                  <span style={{ fontSize: 10, color: gf.status === 'done' ? '#86efac' : '#fca5a5' }}>
                    {gf.status === 'done' ? '✓ généré' : '✗ erreur'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Completion banner ─────────────────────────────── */}
        {phase === 'done' && generatedFiles.filter(f => f.status === 'done').length > 0 && (
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(200,255,77,0.06)', border: '1px solid rgba(200,255,77,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>🎉</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>
              Génération terminée !
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Clique sur chaque fichier dans la liste<br/>
              de gauche pour voir et <strong style={{ color: 'var(--text-2)' }}>accepter / refuser</strong><br/>
              les modifications directement dans l'éditeur.
            </div>
          </div>
        )}

        {/* ── Activity log ──────────────────────────────────── */}
        {log.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>JOURNAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {log.map(({ msg, type, ts }) => (
                <div key={ts} className="mono" style={{ fontSize: 11, color: type === 'error' ? '#fca5a5' : 'var(--text-3)', lineHeight: 1.6 }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reset button ──────────────────────────────────── */}
        {phase === 'done' && (
          <button className="btn btn-ghost btn-sm" onClick={reset} style={{ justifyContent: 'center', gap: 6 }}>
            <Icon name="plus" size={12}/> Nouvelle tâche
          </button>
        )}
      </div>
    </div>
  )
}
