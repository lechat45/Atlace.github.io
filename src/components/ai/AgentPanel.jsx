import { useState, useRef, useEffect, useCallback } from 'react'
import { askAIStream, withRetry, getActiveModel, stripThinking } from '../../lib/ai'
import Groq from 'groq-sdk'
import { extractCode } from '../../lib/diff'
import Icon from '../icons/Icon'

// ── Dedicated agent model ──────────────────────────────────
// llama-3.3-70b has MUCH higher TPM limits than openai/gpt-oss-120b (8K)
// and is excellent at following precise code-generation instructions.
const AGENT_MODEL = 'llama-3.3-70b-versatile'
const BUILTIN_KEY = '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'

// ── Parse numbered TODO list ───────────────────────────────
function parseTodos(text) {
  return (text || '').split('\n')
    .map(line => {
      const m = line.match(/^(\d+)[.)]\s+(.+?)(?:\s*[→>]\s*(.+))?$/)
      if (!m) return null
      return {
        step:   parseInt(m[1]),
        title:  m[2].trim(),
        file:   m[3]?.trim().split(/[,\s]/)[0].trim() || null,
        status: 'pending',
      }
    })
    .filter(Boolean)
}

// ── Status icon ────────────────────────────────────────────
function StepIcon({ status }) {
  if (status === 'running') return (
    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}/>
  )
  if (status === 'done')    return <Icon name="check" size={14} style={{ color: '#86efac', flexShrink: 0 }}/>
  if (status === 'error')   return <Icon name="x"     size={14} style={{ color: '#fca5a5', flexShrink: 0 }}/>
  if (status === 'waiting') return <span style={{ flexShrink: 0, fontSize: 12 }}>⏳</span>
  return <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border-2)', flexShrink: 0 }}/>
}

// ── Countdown display ──────────────────────────────────────
function Countdown({ ms, onDone }) {
  const [remaining, setRemaining] = useState(Math.ceil(ms / 1000))
  useEffect(() => {
    const start = Date.now()
    const total = ms
    const iv = setInterval(() => {
      const elapsed = Date.now() - start
      const left = Math.ceil((total - elapsed) / 1000)
      if (left <= 0) { clearInterval(iv); setRemaining(0); onDone?.() }
      else setRemaining(left)
    }, 200)
    return () => clearInterval(iv)
  }, [ms])
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 9,
      background: 'rgba(255,203,94,0.06)',
      border: '1px solid rgba(255,203,94,0.2)',
    }}>
      <span style={{ fontSize: 14 }}>⏳</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warn)' }}>
          Limite de débit — pause {remaining}s
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-4)', fontFamily: 'Fira Code', marginTop: 1 }}>
          Groq TPM · reprise automatique
        </div>
      </div>
    </div>
  )
}

// ── Direct Groq stream with retry + onWait callback ────────
async function streamWithRetry(systemPrompt, userMessage, onChunk, onWait, opts = {}) {
  const client = new Groq({ apiKey: BUILTIN_KEY, dangerouslyAllowBrowser: true })
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userMessage },
  ]
  const stream = await withRetry(
    () => client.chat.completions.create({
      model: AGENT_MODEL,
      messages,
      stream: true,
      max_tokens:  opts.maxTokens  ?? 6000,
      temperature: opts.temperature ?? 0,
    }),
    { maxAttempts: 4, onWait }
  )
  let full = ''
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || ''
    if (token) { full += token; onChunk(token, full) }
  }
  return full
}

// ── Main component ─────────────────────────────────────────
export default function AgentPanel({ files, project, onProposedChanges }) {
  const [task,           setTask]           = useState('')
  const [phase,          setPhase]          = useState('idle')
  const [todos,          setTodos]          = useState([])
  const [currentStep,    setCurrentStep]    = useState(-1)
  const [generatedFiles, setGeneratedFiles] = useState([])
  const [streamText,     setStreamText]     = useState('')
  const [log,            setLog]            = useState([])
  const [waitMs,         setWaitMs]         = useState(0)   // >0 = showing countdown
  const [waitDone,       setWaitDone]       = useState(false)

  const filesRef  = useRef(files)
  const cancelRef = useRef(false)

  useEffect(() => { filesRef.current = files }, [files])

  function addLog(msg, type = 'info') {
    setLog(prev => [...prev, { msg, type, ts: Date.now() + Math.random() }])
  }

  // Called when Groq returns 429 — show countdown to user
  const onWait = useCallback((ms) => {
    const secs = Math.ceil(ms / 1000)
    addLog(`⏳ Limite Groq TPM — reprise dans ${secs}s…`, 'warn')
    setWaitMs(ms)
    setWaitDone(false)
  }, [])

  // ── Planning prompt ────────────────────────────────────────
  function buildPlanPrompt(fileList) {
    return {
      sys: `Tu es un chef de projet développement senior. Tu analyses des tâches et crées des plans d'action précis.

RÈGLES:
- Réponds UNIQUEMENT avec une liste numérotée, RIEN d'autre (pas d'intro, pas de conclusion)
- 2 à 4 étapes maximum
- Chaque étape modifie UN seul fichier
- Format EXACT: N. [verbe d'action + détail précis] → [fichier.ext]
- Préfère modifier des fichiers existants plutôt que créer

FICHIERS DU PROJET: ${fileList}`,
      user: `PROJET: "${project?.name || 'projet'}" (${project?.main_language || 'JS'})
TÂCHE: ${task}

Planifie les étapes de développement.`,
    }
  }

  // ── Code generation prompt ─────────────────────────────────
  // KEY FIX: show the FULL file — no char limit.
  // Truncating to 3000 chars was the root cause: the AI only saw
  // ~250 lines of a 300-line file and "invented" the rest.
  function buildCodePrompt(todo, parsedTodos, oldContent, lang, { strict = false } = {}) {
    const oldLines = oldContent ? oldContent.split('\n').length : 0
    const minLines = Math.max(10, Math.floor(oldLines * 0.85))

    const otherCtx = filesRef.current
      .filter(f => f.filename !== todo.file)
      .slice(0, 3)
      .map(f => `// ${f.filename}: ${(f.content || '').split('\n').slice(0, 5).join(' ').slice(0, 160)}…`)
      .join('\n')

    // Strict mode is used on retry when truncation was detected
    const strictBlock = strict ? `
⚠ ATTENTION RETRY: Ta précédente réponse avait trop peu de lignes.
Le fichier ORIGINAL fait ${oldLines} lignes. Ta réponse DOIT en avoir au moins ${minLines}.
Chaque ligne du fichier original doit être présente dans ta réponse, sauf celles explicitement modifiées par cette étape.
` : ''

    const sys = `Tu es un éditeur de code de précision chirurgicale. Tu modifies UNIQUEMENT ce qui est demandé.
${strictBlock}
PHILOSOPHIE FONDAMENTALE:
Ta réponse = copie exacte de l'original + SEULEMENT les modifications de cette étape.
Toute ligne qui n'est PAS concernée par la modification doit être IDENTIQUE à l'original.

PROJET: "${project?.name || 'projet'}" · ${project?.main_language || 'JS'}
TÂCHE GLOBALE: ${task}
ÉTAPE ${todo.step}/${parsedTodos.length}: ${todo.title}
FICHIER: ${todo.file} (${lang}) · ${oldLines} lignes
${otherCtx ? `\nFICHIERS CONNEXES (contexte):\n${otherCtx}\n` : ''}
FICHIER ORIGINAL COMPLET — ${oldLines} lignes (CONSERVE TOUT):
\`\`\`${lang}
${oldContent || '// fichier vide — crée le contenu approprié'}
\`\`\`

RÈGLES ABSOLUES (violation = réponse invalide):
① Réponds UNIQUEMENT avec \`\`\`${lang}\\n...\\n\`\`\` — zéro texte avant ou après
② Génère LE FICHIER ENTIER, première ligne jusqu'à la dernière
③ MINIMUM ${minLines} lignes — le fichier original en a ${oldLines}
④ INTERDIT: "...", "// reste du code", "// existing code", "// unchanged", placeholders
⑤ INTERDIT: supprimer des imports, des fonctions ou de la logique existante
⑥ Seules les lignes directement liées à "${todo.title}" peuvent changer
⑦ Code 100% fonctionnel, aucune fonction vide ou stub`

    const user = `Modifie "${todo.file}" pour: ${todo.title}

Rappel: le fichier original fait ${oldLines} lignes. Commence directement par \`\`\`${lang}`

    return { sys, user }
  }

  // ── Main agent loop ────────────────────────────────────────
  async function runAgent() {
    if (!task.trim() || phase !== 'idle') return
    cancelRef.current = false
    setPhase('planning')
    setTodos([]); setGeneratedFiles([]); setLog([]); setCurrentStep(-1); setStreamText(''); setWaitMs(0)

    const fileList = filesRef.current.map(f => `${f.filename}`).join(', ') || 'aucun fichier'
    addLog('🧠 Analyse de la tâche en cours…')

    // ── Phase 1: Planning ──────────────────────────────────
    const { sys: planSys, user: planUser } = buildPlanPrompt(fileList)
    let planText = ''
    try {
      await streamWithRetry(
        planSys, planUser,
        (_t, full) => { planText = full; setStreamText(full) },
        onWait,
        { temperature: 0.2, maxTokens: 512 }
      )
    } catch (err) {
      addLog('❌ Erreur planification : ' + err.message, 'error')
      setPhase('idle'); return
    }

    const cleanPlan    = stripThinking(planText)
    const parsedTodos  = parseTodos(cleanPlan)

    if (parsedTodos.length === 0) {
      addLog('❌ Plan illisible — essaie une description plus précise', 'error')
      setPhase('idle'); return
    }

    setTodos(parsedTodos); setStreamText('')
    addLog(`✅ Plan établi : ${parsedTodos.length} étape(s) — génération du code…`)
    setPhase('executing')

    // ── Phase 2: Execute all steps ────────────────────────
    const collectedChanges = []

    for (let idx = 0; idx < parsedTodos.length; idx++) {
      if (cancelRef.current) break

      const todo = parsedTodos[idx]
      setCurrentStep(idx)
      setTodos(prev => prev.map((t, i) => i === idx ? { ...t, status: 'running' } : t))
      addLog(`▶ Étape ${todo.step}/${parsedTodos.length} : ${todo.title}`)

      const latest     = filesRef.current
      const target     = latest.find(f =>
        f.filename === todo.file ||
        f.filename?.toLowerCase() === todo.file?.toLowerCase()
      )
      const oldContent  = target?.content || ''
      const ext         = (todo.file || 'index.js').split('.').pop()?.toLowerCase() || 'js'
      const lang        = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', css: 'css', html: 'html', json: 'json', md: 'markdown' }[ext] || ext

      // Helper: run one code-generation attempt
      const runCodeStep = async (strict = false) => {
        const { sys: codeSys, user: codeUser } = buildCodePrompt(todo, parsedTodos, oldContent, lang, { strict })
        let stepText = ''
        setWaitMs(0)
        await streamWithRetry(
          codeSys, codeUser,
          (_t, full) => { stepText = full; setStreamText(full) },
          (ms) => {
            setTodos(prev => prev.map((t, i) => i === idx ? { ...t, status: 'waiting' } : t))
            onWait(ms)
          },
          { temperature: 0, maxTokens: 8000 }
        )
        setTodos(prev => prev.map((t, i) => i === idx ? { ...t, status: 'running' } : t))
        setWaitMs(0)
        return stepText
      }

      let stepText = ''
      try {
        stepText = await runCodeStep(false)
      } catch (err) {
        addLog(`❌ Étape ${todo.step} échouée : ${err.message}`, 'error')
        setTodos(prev => prev.map((t, i) => i === idx ? { ...t, status: 'error' } : t))
        setGeneratedFiles(prev => [...prev, { filename: todo.file || `step${todo.step}.js`, status: 'error' }])
        continue
      }

      setStreamText('')
      let newContent = extractCode(stripThinking(stepText))
      const filename  = todo.file || `step${todo.step}.js`
      const oldLines  = oldContent ? oldContent.split('\n').length : 0
      let   newLines  = newContent ? newContent.split('\n').length : 0

      // ── Auto-retry if output was severely truncated ──────
      if (oldLines > 20 && newLines < oldLines * 0.75) {
        addLog(`⚠ Truncation détectée (${oldLines}→${newLines} lignes) — 2e tentative…`, 'warn')
        try {
          const retryText = await runCodeStep(true)   // strict=true adds extra warning
          setStreamText('')
          const retryContent = extractCode(stripThinking(retryText))
          const retryLines   = retryContent ? retryContent.split('\n').length : 0
          if (retryLines > newLines) {
            addLog(`↻ Retry : ${newLines}→${retryLines} lignes`, 'info')
            newContent = retryContent
            newLines   = retryLines
          } else {
            addLog(`↻ Retry inchangé (${retryLines} lignes) — conserve 1ère tentative`, 'warn')
          }
        } catch (err) {
          addLog(`⚠ Retry échoué : ${err.message}`, 'warn')
        }
      }

      // Still very short → warn but continue with best result
      if (oldLines > 20 && newLines < oldLines * 0.6) {
        addLog(`⚠ ${filename} : possible perte de code (${oldLines}→${newLines} lignes)`, 'error')
      }

      if (!newContent.trim()) {
        addLog(`❌ ${filename} : aucun code extrait`, 'error')
        setTodos(prev => prev.map((t, i) => i === idx ? { ...t, status: 'error' } : t))
        setGeneratedFiles(prev => [...prev, { filename, status: 'error' }])
        continue
      }

      collectedChanges.push({ filename, oldContent, newContent })
      setGeneratedFiles(prev => [...prev, { filename, status: 'done', lines: newLines }])
      setTodos(prev => prev.map((t, i) => i === idx ? { ...t, status: 'done' } : t))
      addLog(`✅ ${filename} — ${newLines} lignes${oldLines > 0 ? ` (original: ${oldLines})` : ''}`)

      // Small pause between steps to avoid hitting rate limits
      if (idx < parsedTodos.length - 1 && !cancelRef.current) {
        await new Promise(r => setTimeout(r, 800))
      }
    }

    setPhase('done')
    setCurrentStep(-1)
    setStreamText('')
    setWaitMs(0)

    if (!cancelRef.current && collectedChanges.length > 0) {
      addLog(`🎉 ${collectedChanges.length} fichier(s) prêt(s) — révise dans l'éditeur`)
      onProposedChanges?.(collectedChanges)
    } else if (cancelRef.current) {
      addLog('⚠ Annulé')
    } else {
      addLog('⚠ Aucun code généré', 'error')
    }
  }

  function reset() {
    cancelRef.current = true
    setTimeout(() => {
      cancelRef.current = false
      setPhase('idle'); setTask(''); setTodos([]); setGeneratedFiles([])
      setLog([]); setCurrentStep(-1); setStreamText(''); setWaitMs(0)
    }, 50)
  }

  const isRunning = phase === 'planning' || phase === 'executing'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-deep)' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderBottom: '1px solid var(--border-0)',
        background: 'rgba(255,255,255,0.015)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="wand" size={13} style={{ color: 'var(--accent)' }}/>
          <span className="eyebrow" style={{ fontSize: 10 }}>AGENT IA</span>
          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(200,255,77,0.12)', color: 'var(--accent)', border: '1px solid rgba(200,255,77,0.3)', fontWeight: 700 }}>BÊTA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'Fira Code', fontSize: 9, color: 'var(--text-4)' }}>
            llama-3.3-70b
          </span>
          {(isRunning || phase === 'done') && (
            <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 11 }} onClick={reset}>
              <Icon name="refresh" size={11}/> Reset
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Task input ─────────────────────────────────── */}
        {phase === 'idle' && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>QUE DOIS-JE CODER ?</div>
            <textarea
              className="input"
              value={task}
              onChange={e => setTask(e.target.value)}
              placeholder={"Ex: Ajoute un formulaire de contact avec validation\nEx: Crée un système d'authentification JWT\nEx: Ajoute un dark mode à l'application\nEx: Optimise les performances du composant liste"}
              rows={5}
              style={{ resize: 'none', height: 'auto', fontSize: 12.5, lineHeight: 1.65, borderRadius: 10 }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runAgent() }}
            />
            <button
              className="btn btn-primary"
              onClick={runAgent}
              disabled={!task.trim()}
              style={{ width: '100%', marginTop: 10, justifyContent: 'center', gap: 7, height: 40, borderRadius: 10, opacity: !task.trim() ? 0.5 : 1 }}
            >
              <Icon name="wand" size={14}/> Lancer l'agent
              <span style={{ fontFamily: 'Fira Code', fontSize: 10, opacity: 0.6 }}>⌘↵</span>
            </button>

            {/* Info */}
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-0)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.7 }}>
                <div style={{ marginBottom: 4, color: 'var(--text-3)', fontWeight: 500, fontSize: 11.5 }}>Comment ça marche</div>
                <div>① L'agent <b style={{ color: 'var(--text-2)' }}>planifie</b> les étapes automatiquement</div>
                <div>② Il <b style={{ color: 'var(--text-2)' }}>génère le code complet</b> de chaque fichier</div>
                <div>③ Tu <b style={{ color: '#86efac' }}>acceptes</b> ou <b style={{ color: '#fca5a5' }}>refuses</b> chaque diff dans l'éditeur</div>
              </div>
            </div>
          </div>
        )}

        {/* ── TODO plan ──────────────────────────────────── */}
        {todos.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>PLAN D'ACTION</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {todos.map((todo, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                  borderRadius: 9,
                  background: currentStep === i
                    ? 'rgba(200,255,77,0.06)'
                    : todo.status === 'done' ? 'rgba(134,239,172,0.03)' : 'var(--surface-0)',
                  border: `1px solid ${currentStep === i
                    ? 'rgba(200,255,77,0.22)'
                    : todo.status === 'done' ? 'rgba(134,239,172,0.15)' : 'var(--border-0)'}`,
                  transition: 'all 200ms',
                }}>
                  <StepIcon status={todo.status}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: currentStep === i ? 600 : 400,
                      color: todo.status === 'done' ? 'var(--text-3)' : 'var(--text-1)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {todo.step}. {todo.title}
                    </div>
                    {todo.file && (
                      <div style={{ fontFamily: 'Fira Code', fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>
                        → {todo.file}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Countdown (rate limit wait) ─────────────────── */}
        {waitMs > 0 && (
          <Countdown ms={waitMs} onDone={() => setWaitMs(0)} />
        )}

        {/* ── Stream preview ─────────────────────────────── */}
        {streamText && !waitMs && (
          <div style={{ borderRadius: 10, border: '1px solid rgba(200,255,77,0.15)', background: 'rgba(200,255,77,0.025)', overflow: 'hidden' }}>
            <div style={{ padding: '5px 10px', borderBottom: '1px solid rgba(200,255,77,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulseDot 0.8s ease-in-out infinite' }}/>
              <span style={{ fontFamily: 'Fira Code', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>génération en cours</span>
            </div>
            <pre style={{ margin: 0, padding: '8px 10px', fontFamily: 'Fira Code', fontSize: 10.5, color: 'var(--text-3)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 120, overflow: 'hidden', lineHeight: 1.5 }}>
              {streamText.slice(-600)}
              <span style={{ display: 'inline-block', width: 6, height: 12, background: 'var(--accent)', borderRadius: 2, verticalAlign: 'text-bottom', marginLeft: 2, animation: 'pulseDot 0.7s ease-in-out infinite' }}/>
            </pre>
          </div>
        )}

        {/* ── Generated files ─────────────────────────────── */}
        {generatedFiles.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>FICHIERS MODIFIÉS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {generatedFiles.map((gf, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  borderRadius: 8,
                  background: gf.status === 'done' ? 'rgba(134,239,172,0.05)' : 'rgba(252,165,165,0.05)',
                  border: `1px solid ${gf.status === 'done' ? 'rgba(134,239,172,0.18)' : 'rgba(252,165,165,0.18)'}`,
                }}>
                  <Icon name="fileCode" size={11} style={{ color: gf.status === 'done' ? '#86efac' : '#fca5a5', flexShrink: 0 }}/>
                  <span style={{ fontFamily: 'Fira Code', fontSize: 11.5, color: 'var(--text-2)', flex: 1 }}>{gf.filename}</span>
                  <span style={{ fontFamily: 'Fira Code', fontSize: 10, color: gf.status === 'done' ? '#86efac' : '#fca5a5' }}>
                    {gf.status === 'done' ? `✓ ${gf.lines || '?'} lignes` : '✗ erreur'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Done banner ─────────────────────────────────── */}
        {phase === 'done' && generatedFiles.some(f => f.status === 'done') && (
          <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(200,255,77,0.05)', border: '1px solid rgba(200,255,77,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>Génération terminée !</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
              Les fichiers modifiés sont marqués en <span style={{ color: '#f59e0b' }}>jaune</span> dans la liste.<br/>
              Clique dessus pour voir le <b style={{ color: '#86efac' }}>diff</b> et l'accepter ou le refuser.
            </div>
          </div>
        )}

        {/* ── Log ─────────────────────────────────────────── */}
        {log.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>JOURNAL</div>
            <div style={{
              borderRadius: 8, background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-0)',
              padding: '8px 10px',
              display: 'flex', flexDirection: 'column', gap: 2,
              maxHeight: 160, overflowY: 'auto',
            }}>
              {log.map(({ msg, type, ts }) => (
                <div key={ts} style={{
                  fontFamily: 'Fira Code', fontSize: 11, lineHeight: 1.65,
                  color: type === 'error' ? '#fca5a5' : type === 'warn' ? 'var(--warn)' : 'var(--text-3)',
                }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── New task button ──────────────────────────────── */}
        {phase === 'done' && (
          <button className="btn btn-ghost" onClick={reset} style={{ justifyContent: 'center', gap: 6, borderRadius: 10 }}>
            <Icon name="plus" size={12}/> Nouvelle tâche
          </button>
        )}
      </div>
    </div>
  )
}
