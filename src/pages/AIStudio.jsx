import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { askAI, getActiveProvider, getActiveModel, parseAIError } from '../lib/ai'
import { useToast } from '../components/ui/Toast'
import Icon from '../components/icons/Icon'

// ── Code block ─────────────────────────────────────────────
function CodeBlock({ code, lang = 'code' }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="editor" style={{ margin: "10px 0", borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--border-1)", background: "rgba(0,0,0,0.2)" }}>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", letterSpacing: "0.1em" }}>{lang.toUpperCase()}</span>
        <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={copy}>
          <Icon name={copied ? "check" : "copy"} size={11}/><span>{copied ? "Copié !" : "Copier"}</span>
        </button>
      </div>
      <pre className="code-area" style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{code}</pre>
    </div>
  )
}

// ── Message content renderer ───────────────────────────────
function MsgContent({ content }) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-1)" }}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const lang = lines[0].trim() || 'code'
          const code = lines.slice(1).join('\n')
          return <CodeBlock key={i} code={code} lang={lang}/>
        }
        return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>
      })}
    </div>
  )
}

// ── Chat page ──────────────────────────────────────────────
export default function AIStudio() {
  const { user } = useAuth()
  const { projects } = useProjects(user?.id)
  const toast = useToast()

  const [conversations, setConversations] = useState([
    { id: 1, title: 'Nouvelle conversation', messages: [] }
  ])
  const [activeConvId, setActiveConvId] = useState(1)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const activeProvider = getActiveProvider()
  const providerModels = activeProvider.models
  const [model, setModel] = useState(() => getActiveModel())
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [convSearch, setConvSearch] = useState('')

  const bottomRef = useRef(null)
  const taRef = useRef(null)

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0]
  const messages = activeConv?.messages || []
  const totalTokens = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function newConv() {
    const id = Date.now()
    setConversations(prev => [...prev, { id, title: `Conversation ${prev.length + 1}`, messages: [] }])
    setActiveConvId(id)
    setInput('')
  }

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')

    // Auto-title on first message
    setConversations(prev => prev.map(c => c.id === activeConvId
      ? {
          ...c,
          title: c.messages.length === 0 ? userMsg.slice(0, 42) + (userMsg.length > 42 ? '…' : '') : c.title,
          messages: [...c.messages, { role: 'user', content: userMsg, ts: Date.now() }],
        }
      : c
    ))

    setLoading(true)
    try {
      const selectedProject = projects?.find(p => p.id === selectedProjectId)
      const sysPrompt = selectedProject
        ? `Tu es un assistant IA expert pour le projet "${selectedProject.name}". ${selectedProject.description || ''} Réponds en français par défaut.`
        : 'Tu es un assistant IA utile, précis et concis. Réponds en français par défaut.'

      const history = messages.filter(m => !m.isError).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

      const reply = await askAI(sysPrompt, history, userMsg, model)

      setConversations(prev => prev.map(c => c.id === activeConvId
        ? { ...c, messages: [...c.messages, { role: 'assistant', content: reply, ts: Date.now() }] }
        : c
      ))
    } catch (err) {
      const friendly = parseAIError(err)
      toast(friendly, 'error')
      setConversations(prev => prev.map(c => c.id === activeConvId
        ? { ...c, messages: [...c.messages, { role: 'assistant', content: `Erreur : ${friendly}`, ts: Date.now(), isError: true }] }
        : c
      ))
    }
    setLoading(false)
  }

  function handleKey(e) {
    if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey)) || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault()
      send()
    }
  }

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(convSearch.toLowerCase())
  )

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Vous'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", height: "100%", minHeight: 0 }}>

      {/* ── Conversations sidebar ─────────────────────── */}
      <aside style={{ borderRight: "1px solid var(--border-1)", display: "flex", flexDirection: "column", background: "rgba(7,7,12,0.4)" }}>
        <div style={{ padding: "16px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="eyebrow">CONVERSATIONS</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={newConv} title="Nouvelle conversation">
            <Icon name="plus" size={13}/>
          </button>
        </div>
        <div style={{ padding: "0 12px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", border: "1px solid var(--border-1)", borderRadius: 8, height: 30, background: "var(--surface-0)" }}>
            <Icon name="search" size={12} style={{ color: "var(--text-3)" }}/>
            <input
              value={convSearch}
              onChange={e => setConvSearch(e.target.value)}
              placeholder="Filtrer…"
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-1)", fontSize: 12.5, flex: 1, fontFamily: "DM Sans" }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px" }}>
          {filteredConvs.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              style={{
                padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                background: c.id === activeConvId ? "var(--surface-2)" : "transparent",
                marginBottom: 2,
                borderLeft: c.id === activeConvId ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.title}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
                  {c.messages.length} msg
                </span>
                <span className="mono" style={{ fontSize: 10, color: "var(--text-4)" }}>
                  {c.id === 1 ? 'maintenant' : 'récent'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main thread ───────────────────────────────── */}
      <main style={{ display: "flex", flexDirection: "column", minHeight: 0, background: "transparent" }}>
        {/* Thread header */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--border-1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0 }}>
          <div>
            <div className="display" style={{ fontSize: 18 }}>{activeConv.title}</div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4, letterSpacing: "0.06em" }}>
              {messages.length} MESSAGES · ~{totalTokens} TOKENS · {providerModels.find(m => m.id === model)?.label || model}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={newConv}>
              <Icon name="plus" size={12}/><span>Nouveau</span>
            </button>
            <button className="btn btn-ghost btn-icon btn-sm">
              <Icon name="more" size={14}/>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 16px", display: "flex", flexDirection: "column", gap: 18 }}>
          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center", background: "var(--accent-soft)", border: "1px solid rgba(200,255,77,0.3)" }}>
                <Icon name="sparkles" size={22} style={{ color: "var(--accent)" }}/>
              </div>
              <div>
                <div className="display" style={{ fontSize: 20, marginBottom: 8 }}>Chat IA · {activeProvider.label}</div>
                <div style={{ color: "var(--text-3)", fontSize: 14 }}>Propulsé par {providerModels.find(m => m.id === model)?.label || model}</div>
                <div style={{ color: "var(--text-4)", fontSize: 12.5, marginTop: 4 }}>Posez une question pour commencer</div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignSelf: msg.role === 'user' ? "flex-end" : "flex-start", maxWidth: 760, width: "100%" }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, borderRadius: 999, flexShrink: 0,
                  background: "var(--bg-elev)", border: "1px solid var(--border-1)",
                  display: "grid", placeItems: "center", color: "var(--accent)",
                }}>
                  <Icon name="sparkles" size={13}/>
                </div>
              )}
              <div className={"msg-bubble " + (msg.role === 'user' ? "user" : msg.isError ? "" : "ai")}
                style={{ flex: msg.role === 'user' ? "0 1 auto" : 1, maxWidth: msg.role === 'user' ? 560 : undefined, ...(msg.isError ? { borderColor: "rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.06)" } : {}) }}
              >
                <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.12em", marginBottom: 8 }}>
                  {msg.role === 'user' ? initial : (activeProvider.label.split(' ')[0] + ' · ' + (providerModels.find(m => m.id === model)?.label?.split(' ')[0] || 'AI')).toUpperCase()}
                </div>
                <MsgContent content={msg.content}/>
              </div>
              {msg.role === 'user' && (
                <div style={{
                  width: 28, height: 28, borderRadius: 999, flexShrink: 0,
                  background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                  display: "grid", placeItems: "center",
                  fontFamily: "Syne", fontWeight: 700, fontSize: 12,
                }}>{initial}</div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, flexShrink: 0, background: "var(--bg-elev)", border: "1px solid var(--border-1)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
                <Icon name="sparkles" size={13}/>
              </div>
              <div className="msg-bubble ai" style={{ padding: "16px" }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  {activeProvider.label.toUpperCase()} <span className="dot dot-on" style={{ width: 4, height: 4 }}/> EN COURS…
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: 999, background: "var(--accent)",
                      animation: "pulseDot 1.2s ease-in-out infinite",
                      animationDelay: `${i * 0.2}s`,
                    }}/>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Composer */}
        <div style={{ padding: "12px 28px 24px", flexShrink: 0 }}>
          <div className="composer">
            <textarea
              ref={taRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              disabled={loading}
              placeholder="Posez une question, collez du code… (⌘↵ ou Entrée pour envoyer)"
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--border-0)" }}>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="btn btn-ghost btn-sm"
                style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
              >
                <option value="">Aucun projet</option>
                {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="btn btn-ghost btn-sm"
                style={{ cursor: "pointer", fontFamily: "Fira Code", fontSize: 11 }}
              >
                {providerModels.map(m => <option key={m.id} value={m.id} style={{ background: '#0d0d18', color: '#e8e8f0' }}>{m.label}</option>)}
              </select>
              <span style={{ flex: 1 }}/>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{input.length} / 16 384</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={send}
                disabled={loading || !input.trim()}
                style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}
              >
                <Icon name="send" size={12}/>
                <span>Envoyer</span>
                <span className="kbd" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(0,0,0,0.3)" }}>⌘↵</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Inspector sidebar ─────────────────────────── */}
      <aside style={{ borderLeft: "1px solid var(--border-1)", padding: "16px 18px", overflowY: "auto", background: "rgba(7,7,12,0.4)", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>MODÈLE ACTIF</div>
          <div style={{ padding: 12, border: "1px solid var(--border-1)", borderRadius: 10, background: "var(--surface-0)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span className="dot dot-on"/>
              <span className="mono" style={{ fontSize: 12.5, color: "var(--text-1)" }}>
                {providerModels.find(m => m.id === model)?.label || model}
              </span>
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.7 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Provider</span><span style={{ color: activeProvider.color }}>{activeProvider.label}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Contexte</span><span style={{ color: "var(--text-2)" }}>128K tk</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Clé</span><span style={{ color: "var(--text-2)" }}>{activeProvider.requiresKey ? 'Votre clé' : 'Intégrée'}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Prix</span><span style={{ color: activeProvider.requiresKey ? "var(--text-2)" : "var(--success)" }}>{activeProvider.requiresKey ? 'Votre compte' : 'Gratuit'}</span></div>
            </div>
          </div>
        </div>

        {selectedProjectId && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>PROJET LIÉ</div>
            <div style={{ padding: 10, border: "1px solid var(--accent-soft)", borderRadius: 10, background: "var(--accent-soft)" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)" }}>
                {projects?.find(p => p.id === selectedProjectId)?.name}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>
                {projects?.find(p => p.id === selectedProjectId)?.description?.slice(0, 60) || 'Contexte actif'}
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>USAGE SESSION</div>
          <div className="mono" style={{ fontSize: 10.5, lineHeight: 1.8, color: "var(--text-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Messages</span>
              <span style={{ color: "var(--text-2)" }}>{messages.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tokens ~</span>
              <span style={{ color: "var(--text-2)" }}>{totalTokens}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Conversations</span>
              <span style={{ color: "var(--text-2)" }}>{conversations.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Coût estimé</span>
              <span style={{ color: "var(--success)" }}>$0.00</span>
            </div>
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>MODÈLES · {activeProvider.label.toUpperCase()}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {providerModels.map(m => (
              <button
                key={m.id}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: "flex-start", height: 30, fontSize: 11, fontFamily: "Fira Code", color: m.id === model ? "var(--accent)" : "var(--text-2)", background: m.id === model ? "var(--accent-soft)" : "transparent" }}
                onClick={() => setModel(m.id)}
              >
                <span className={"dot " + (m.id === model ? "dot-on" : "")} style={{ width: 4, height: 4 }}/>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
