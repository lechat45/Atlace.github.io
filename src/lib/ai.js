/**
 * Unified AI API — default is always Groq with the built-in key.
 * User can override via Settings → Moteur IA (stored in localStorage).
 */
import Groq from 'groq-sdk'

// ── Built-in Groq key — always the fallback ────────────────
const BUILTIN_GROQ_KEY = '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'
const PREF_KEY = 'atlace_ai_pref'

// ── Provider catalogue ─────────────────────────────────────
export const AI_PROVIDERS = [
  {
    id: 'groq-builtin',
    label: 'Groq (intégré)',
    sublabel: 'Clé Atlace — gratuit, sans configuration',
    icon: 'zap',
    color: 'var(--accent)',
    requiresKey: false,
    models: [
      { id: 'openai/gpt-oss-120b',      label: 'GPT-OSS 120B ★ Meilleur code' },
      { id: 'openai/gpt-oss-20b',       label: 'GPT-OSS 20B (ultra-rapide)' },
      { id: 'llama-3.3-70b-versatile',  label: 'Llama 3.3 70B (polyvalent)' },
      { id: 'llama-3.1-8b-instant',     label: 'Llama 3.1 8B (rapide)' },
    ],
    defaultModel: 'openai/gpt-oss-120b',
  },
  {
    id: 'groq-custom',
    label: 'Groq (ma clé)',
    sublabel: 'Utilisez votre propre clé API Groq',
    icon: 'key',
    color: '#f97316',
    requiresKey: true,
    keyPlaceholder: 'gsk_...',
    models: [
      { id: 'openai/gpt-oss-120b',      label: 'GPT-OSS 120B ★ Meilleur code' },
      { id: 'openai/gpt-oss-20b',       label: 'GPT-OSS 20B (ultra-rapide)' },
      { id: 'llama-3.3-70b-versatile',  label: 'Llama 3.3 70B (polyvalent)' },
      { id: 'llama-3.1-8b-instant',     label: 'Llama 3.1 8B (rapide)' },
    ],
    defaultModel: 'openai/gpt-oss-120b',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    sublabel: 'GPT-4o, GPT-4o Mini…',
    icon: 'cpu',
    color: '#10b981',
    requiresKey: true,
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'gpt-4o-mini',    label: 'GPT-4o Mini (rapide)' },
      { id: 'gpt-4o',         label: 'GPT-4o' },
      { id: 'gpt-4-turbo',    label: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo',  label: 'GPT-3.5 Turbo' },
    ],
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    sublabel: 'Claude Haiku, Sonnet, Opus…',
    icon: 'sparkles',
    color: '#a855f7',
    requiresKey: true,
    keyPlaceholder: 'sk-ant-...',
    models: [
      { id: 'claude-3-5-haiku-20241022',   label: 'Claude 3.5 Haiku (rapide)' },
      { id: 'claude-3-5-sonnet-20241022',  label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229',      label: 'Claude 3 Opus' },
    ],
    defaultModel: 'claude-3-5-haiku-20241022',
  },
]

// ── Preference helpers ─────────────────────────────────────
export function getAIPref() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }
  catch { return {} }
}

export function setAIPref(updates) {
  const prev = getAIPref()
  localStorage.setItem(PREF_KEY, JSON.stringify({ ...prev, ...updates }))
}

export function getActiveProvider() {
  const { provider } = getAIPref()
  return AI_PROVIDERS.find(p => p.id === provider) || AI_PROVIDERS[0]
}

// Models that have been decommissioned — auto-reset to default
const DECOMMISSIONED_MODELS = [
  'qwen-qwq-32b', 'qwen/qwen3-32b', 'moonshotai/kimi-k1.5-32b-preview',
  'deepseek-r1-distill-llama-70b', 'deepseek-r1-distill-qwen-32b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
]

export function getActiveModel() {
  const pref     = getAIPref()
  const provider = getActiveProvider()
  const validIds = provider.models.map(m => m.id)
  // If saved model is decommissioned or no longer in the list → reset to default
  if (!pref.model || DECOMMISSIONED_MODELS.includes(pref.model) || !validIds.includes(pref.model)) {
    setAIPref({ model: provider.defaultModel })
    return provider.defaultModel
  }
  return pref.model
}

// ── Hard budget: prevent 413 errors ───────────────────────
// Conservative: ~6 000 chars total input (~1 500 tokens).
// Groq 413 = input_tokens + max_tokens > model context window.
// By keeping input small, we leave room for the output.
const MAX_REQUEST_CHARS = 6_000

function safeTrim(systemPrompt, history, userMessage) {
  let sys  = (systemPrompt || '').slice(0, 1500)   // system prompt cap
  let user = (userMessage  || '').slice(0, 2000)   // user message cap
  let hist = (history || []).slice(-6)             // keep only last 6 messages

  // Drop oldest history entries until total fits
  while (hist.length > 0) {
    const total = sys.length + user.length +
      hist.reduce((n, m) => n + (m.content || '').length, 0)
    if (total <= MAX_REQUEST_CHARS) break
    hist = hist.slice(1)
  }

  // Truncate remaining history messages to stay under budget
  const budget = MAX_REQUEST_CHARS - sys.length - user.length
  let used = 0
  hist = hist.map(m => {
    const cap  = Math.max(0, budget - used)
    const text = (m.content || '').slice(0, Math.min(400, cap))
    used += text.length
    return { ...m, content: text }
  })

  return { sys, hist, user }
}

// ── Strip <think>…</think> reasoning blocks ────────────────
// Models like DeepSeek-R1 and QwQ emit a thinking block before the answer.
// We strip it so only the actual reply is returned.
export function stripThinking(text) {
  return (text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

// ── Main call ──────────────────────────────────────────────
export async function askAI(systemPrompt, history, userMessage, modelOverride) {
  const pref     = getAIPref()
  const provider = getActiveProvider()
  const model    = modelOverride || getActiveModel()
  const { sys, hist, user } = safeTrim(systemPrompt, history, userMessage)

  if (provider.id === 'groq-builtin') {
    return _callGroq(BUILTIN_GROQ_KEY, sys, hist, user, model)
  }
  if (provider.id === 'groq-custom') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé Groq manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callGroq(key, sys, hist, user, model)
  }
  if (provider.id === 'openai') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé OpenAI manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callOpenAI(key, sys, hist, user, model)
  }
  if (provider.id === 'anthropic') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé Anthropic manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callAnthropic(key, sys, hist, user, model)
  }
  throw new Error('Fournisseur IA inconnu : ' + provider.id)
}

// ── Provider implementations ───────────────────────────────
async function _callGroq(apiKey, systemPrompt, history, userMessage, model, opts = {}) {
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true })
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: userMessage },
  ]
  const completion = await client.chat.completions.create({
    model, messages,
    max_tokens:  opts.maxTokens  ?? 2048,
    temperature: opts.temperature ?? 0.6,
  })
  return completion.choices[0]?.message?.content || ''
}

async function _callOpenAI(apiKey, systemPrompt, history, userMessage, model, opts = {}) {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: userMessage },
  ]
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: opts.maxTokens ?? 2048, temperature: opts.temperature ?? 0.7 }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `OpenAI erreur ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}

async function _callAnthropic(apiKey, systemPrompt, history, userMessage, model, opts = {}) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model, max_tokens: opts.maxTokens ?? 2048,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [...history, { role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `Anthropic erreur ${res.status}`)
  }
  const data = await res.json()
  return data.content[0]?.text || ''
}

// ── Streaming call ─────────────────────────────────────────
// opts: { temperature?: number, maxTokens?: number }
export async function askAIStream(systemPrompt, history, userMessage, model, onChunk, opts = {}) {
  const pref     = getAIPref()
  const provider = getActiveProvider()
  const m        = model || getActiveModel()
  const { sys, hist, user } = safeTrim(systemPrompt, history, userMessage)

  if (provider.id === 'groq-builtin') {
    return _callGroqStream(BUILTIN_GROQ_KEY, sys, hist, user, m, onChunk, opts)
  }
  if (provider.id === 'groq-custom') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé Groq manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callGroqStream(key, sys, hist, user, m, onChunk, opts)
  }
  if (provider.id === 'openai') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé OpenAI manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callOpenAIStream(key, sys, hist, user, m, onChunk, opts)
  }
  if (provider.id === 'anthropic') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé Anthropic manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callAnthropicStream(key, sys, hist, user, m, onChunk, opts)
  }
  // Unknown provider — fallback to non-streaming
  const reply = await askAI(systemPrompt, history, userMessage, model)
  onChunk(reply, reply)
  return reply
}

async function _callGroqStream(apiKey, systemPrompt, history, userMessage, model, onChunk, opts = {}) {
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true })
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: userMessage },
  ]
  const stream = await client.chat.completions.create({
    model, messages, stream: true,
    max_tokens:  opts.maxTokens  ?? 2048,
    temperature: opts.temperature ?? 0.6,
  })
  let full = ''
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || ''
    if (token) { full += token; onChunk(token, full) }
  }
  return full
}

async function _callOpenAIStream(apiKey, systemPrompt, history, userMessage, model, onChunk, opts = {}) {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: userMessage },
  ]
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: opts.maxTokens ?? 2048, temperature: opts.temperature ?? 0.7, stream: true }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `OpenAI erreur ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = '', buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n'); buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const json = line.slice(6).trim()
      if (json === '[DONE]') continue
      try {
        const data = JSON.parse(json)
        const token = data.choices[0]?.delta?.content || ''
        if (token) { full += token; onChunk(token, full) }
      } catch {}
    }
  }
  return full
}

async function _callAnthropicStream(apiKey, systemPrompt, history, userMessage, model, onChunk, opts = {}) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model, max_tokens: opts.maxTokens ?? 2048, stream: true,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [...history, { role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `Anthropic erreur ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = '', buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n'); buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.slice(6))
        if (data.type === 'content_block_delta') {
          const token = data.delta?.text || ''
          if (token) { full += token; onChunk(token, full) }
        }
      } catch {}
    }
  }
  return full
}

// ── Error formatter ────────────────────────────────────────
export function parseAIError(err) {
  const msg = err?.message || String(err)
  if (msg.includes('429') || msg.includes('rate_limit'))
    return '⏳ Limite de débit atteinte. Attendez quelques secondes.'
  if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('API key'))
    return '🔑 Clé API invalide. Vérifiez dans Paramètres → Moteur IA.'
  if (msg.includes('503') || msg.includes('overloaded'))
    return '🔄 Serveur surchargé. Réessayez dans un instant.'
  if (msg.includes('manquante') || msg.includes('Configurez'))
    return '⚙️ ' + msg
  return `Erreur : ${msg.split('\n')[0]}`
}

// ── Back-compat: re-export estimateTokens from groq ───────
export { estimateTokens } from './groq.js'
