import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { askAIStream, estimateTokens, getActiveProvider, getActiveModel, parseAIError } from '../../lib/ai'
import { useToast } from '../ui/Toast'
import Icon from '../icons/Icon'

// ── Code block ─────────────────────────────────────────────
function CodeBlock({ code, onInsert }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-1)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 10px', background: 'var(--surface-1)', borderBottom: '1px solid var(--border-0)',
      }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>code</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {onInsert && (
            <button
              onClick={() => onInsert(code)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Icon name="arrowDown" size={10}/> Insérer
            </button>
          )}
          <button
            onClick={copy}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--accent)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}
          >
            <Icon name={copied ? 'check' : 'copy'} size={10}/>
          </button>
        </div>
      </div>
      <pre style={{ margin: 0, padding: '10px 12px', background: '#0a0a14', overflowX: 'auto' }}>
        <code className="mono" style={{ fontSize: 11.5, color: 'var(--text-1)', lineHeight: 1.7 }}>{code}</code>
      </pre>
    </div>
  )
}

// ── Message renderer ───────────────────────────────────────
function MessageContent({ content, onInsert }) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-1)' }}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const code = lines.slice(1).join('\n') || lines[0]
          return <CodeBlock key={i} code={code} onInsert={onInsert}/>
        }
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
      })}
    </div>
  )
}

// ── Quick prompt chips ─────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: 'bookOpen',  label: 'Expliquer le code',     prompt: 'Explique ce code étape par étape en français, de manière claire et détaillée.' },
  { icon: 'bug',       label: 'Trouver les bugs',       prompt: 'Analyse ce code et liste tous les bugs, erreurs ou problèmes potentiels. Propose les corrections.' },
  { icon: 'zap',       label: 'Optimiser',              prompt: 'Optimise ce code pour le rendre plus performant, lisible et conforme aux bonnes pratiques.' },
  { icon: 'wand',      label: 'Ajouter des commentaires', prompt: 'Ajoute des commentaires professionnels et clairs à ce code (JSDoc si applicable).' },
]

// ── AIChat component ───────────────────────────────────────
const AIChat = forwardRef(function AIChat(
  { systemPrompt = '', projectName = '', onInsertCode, showTokens = false },
  ref
) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [model, setModel]       = useState(() => getActiveModel())
  const bottomRef  = useRef(null)
  const doSendRef  = useRef(null)   // always-fresh ref to doSend
  const toast      = useToast()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function buildHistory() {
    return messages
      .filter(m => !m.isError && !m.streaming)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
  }

  async function doSend(userMsg) {
    if (!userMsg?.trim() || loading) return
    const msg = userMsg.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, ts: Date.now() }])
    setLoading(true)

    const placeholderTs = Date.now() + 1
    setMessages(prev => [...prev, { role: 'assistant', content: '', ts: placeholderTs, streaming: true }])

    try {
      const history  = buildHistory()
      const sysPrompt = systemPrompt || (projectName
        ? `Tu es un assistant IA expert pour le projet "${projectName}". Réponds en français par défaut.`
        : 'Tu es un assistant IA utile et précis. Réponds en français par défaut.')

      await askAIStream(sysPrompt, history, msg, model, (_token, full) => {
        setMessages(prev => prev.map(m =>
          m.ts === placeholderTs ? { ...m, content: full } : m
        ))
      })

      setMessages(prev => prev.map(m =>
        m.ts === placeholderTs ? { ...m, streaming: false } : m
      ))
    } catch (err) {
      const friendly = parseAIError(err)
      toast(friendly, 'error')
      setMessages(prev => prev.map(m =>
        m.ts === placeholderTs
          ? { ...m, content: friendly, streaming: false, isError: true }
          : m
      ))
    }
    setLoading(false)
  }

  // Keep ref always pointing to latest doSend (avoids stale-closure issues)
  doSendRef.current = doSend

  // Expose sendMessage via ref so parent can trigger AI from toolbar buttons
  useImperativeHandle(ref, () => ({
    sendMessage(msg) { doSendRef.current?.(msg) },
  }))

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(input) }
  }

  const totalTokens    = showTokens ? messages.reduce((acc, m) => acc + estimateTokens(m.content), 0) : 0
  const activeProvider = getActiveProvider()
  const providerModels = activeProvider.models

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-deep)' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderBottom: '1px solid var(--border-0)',
        background: 'rgba(255,255,255,0.015)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name={activeProvider.icon} size={13} style={{ color: activeProvider.color }}/>
          <span className="eyebrow" style={{ fontSize: 10 }}>ASSISTANT IA</span>
          {!activeProvider.requiresKey && (
            <span style={{
              fontSize: 9, padding: '2px 6px', borderRadius: 99,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              border: '1px solid rgba(200,255,77,0.25)', fontWeight: 600,
            }}>GRATUIT</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showTokens && <span className="mono" style={{ fontSize: 10, color: 'var(--text-4)' }}>~{totalTokens} tok</span>}
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="input"
            style={{ fontSize: 11, padding: '3px 8px', height: 26, width: 'auto', minWidth: 0 }}
          >
            {providerModels.map(m => (
              <option key={m.id} value={m.id} style={{ background: '#0d0d18', color: '#e8e8f0' }}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Empty state with quick prompts */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'var(--accent-soft)', border: '1px solid rgba(200,255,77,0.25)',
              display: 'grid', placeItems: 'center', color: 'var(--accent)',
            }}>
              <Icon name="sparkles" size={20}/>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 3px' }}>
                {activeProvider.label} · {providerModels.find(m => m.id === model)?.label || model}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-4)', margin: 0 }}>Posez une question ou choisissez une action</p>
            </div>
            {/* Quick prompt chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%', maxWidth: 270 }}>
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q.label}
                  onClick={() => doSend(q.prompt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 11px', borderRadius: 8,
                    border: '1px solid var(--border-1)', background: 'var(--surface-0)',
                    cursor: 'pointer', fontSize: 12, color: 'var(--text-2)', textAlign: 'left',
                    transition: 'all 100ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-0)'; e.currentTarget.style.borderColor = 'var(--border-1)' }}
                >
                  <Icon name={q.icon} size={12} style={{ color: 'var(--accent)', flexShrink: 0 }}/>
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div key={msg.ts} style={{ display: 'flex', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
              background: msg.role === 'user' ? 'var(--surface-2)' : 'var(--accent-soft)',
              border: `1px solid ${msg.role === 'user' ? 'var(--border-1)' : 'rgba(200,255,77,0.25)'}`,
              color: msg.role === 'user' ? 'var(--text-2)' : 'var(--accent)',
            }}>
              <Icon name={msg.role === 'user' ? 'user' : 'sparkles'} size={12}/>
            </div>
            <div style={{
              maxWidth: '85%', borderRadius: 14, padding: '8px 12px',
              background: msg.role === 'user'
                ? 'rgba(255,255,255,0.05)'
                : msg.isError ? 'rgba(255,107,107,0.07)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${msg.role === 'user' ? 'var(--border-1)' : msg.isError ? 'rgba(255,107,107,0.2)' : 'var(--border-0)'}`,
              borderTopRightRadius: msg.role === 'user' ? 4 : 14,
              borderTopLeftRadius:  msg.role === 'user' ? 14 : 4,
            }}>
              <MessageContent content={msg.content} onInsert={onInsertCode}/>
              {/* Streaming cursor */}
              {msg.streaming && (
                <span style={{
                  display: 'inline-block', width: 7, height: 14, marginLeft: 3,
                  background: 'var(--accent)', borderRadius: 2, verticalAlign: 'text-bottom',
                  animation: 'pulseDot 0.7s ease-in-out infinite',
                }}/>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef}/>
      </div>

      {/* ── Input ── */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-0)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message… (Entrée pour envoyer)"
            disabled={loading}
            rows={2}
            className="input"
            style={{ flex: 1, height: 'auto', padding: '8px 12px', resize: 'none', fontSize: 12.5, lineHeight: 1.5, opacity: loading ? 0.5 : 1 }}
          />
          <button
            className="btn btn-primary btn-icon"
            onClick={() => doSend(input)}
            disabled={loading || !input.trim()}
            style={{ height: 36, width: 36, flexShrink: 0 }}
          >
            <Icon name="send" size={13}/>
          </button>
        </div>
      </div>
    </div>
  )
})

export default AIChat
