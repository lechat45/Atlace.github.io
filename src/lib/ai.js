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
      { id: 'llama-3.3-70b-versatile',      label: 'Llama 3.3 70B (recommandé)' },
      { id: 'llama-3.1-8b-instant',          label: 'Llama 3.1 8B (rapide)' },
      { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 70B (raisonnement)' },
      { id: 'llama-3.2-11b-vision-preview',  label: 'Llama 3.2 11B Vision' },
    ],
    defaultModel: 'llama-3.3-70b-versatile',
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
      { id: 'llama-3.3-70b-versatile',      label: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant',          label: 'Llama 3.1 8B (rapide)' },
      { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 70B' },
      { id: 'llama-3.2-11b-vision-preview',  label: 'Llama 3.2 11B Vision' },
    ],
    defaultModel: 'llama-3.3-70b-versatile',
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

export function getActiveModel() {
  const pref = getAIPref()
  const provider = getActiveProvider()
  // Verify the saved model is valid for the current provider
  const validIds = provider.models.map(m => m.id)
  return validIds.includes(pref.model) ? pref.model : provider.defaultModel
}

// ── Main call ──────────────────────────────────────────────
export async function askAI(systemPrompt, history, userMessage, modelOverride) {
  const pref   = getAIPref()
  const provider = getActiveProvider()
  const model  = modelOverride || getActiveModel()

  if (provider.id === 'groq-builtin') {
    return _callGroq(BUILTIN_GROQ_KEY, systemPrompt, history, userMessage, model)
  }
  if (provider.id === 'groq-custom') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé Groq manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callGroq(key, systemPrompt, history, userMessage, model)
  }
  if (provider.id === 'openai') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé OpenAI manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callOpenAI(key, systemPrompt, history, userMessage, model)
  }
  if (provider.id === 'anthropic') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé Anthropic manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callAnthropic(key, systemPrompt, history, userMessage, model)
  }
  throw new Error('Fournisseur IA inconnu : ' + provider.id)
}

// ── Provider implementations ───────────────────────────────
async function _callGroq(apiKey, systemPrompt, history, userMessage, model) {
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true })
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: userMessage },
  ]
  const completion = await client.chat.completions.create({ model, messages, max_tokens: 4096 })
  return completion.choices[0]?.message?.content || ''
}

async function _callOpenAI(apiKey, systemPrompt, history, userMessage, model) {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: userMessage },
  ]
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 4096 }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `OpenAI erreur ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}

async function _callAnthropic(apiKey, systemPrompt, history, userMessage, model) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model, max_tokens: 4096,
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
export async function askAIStream(systemPrompt, history, userMessage, model, onChunk) {
  const pref     = getAIPref()
  const provider = getActiveProvider()
  const m        = model || getActiveModel()

  if (provider.id === 'groq-builtin') {
    return _callGroqStream(BUILTIN_GROQ_KEY, systemPrompt, history, userMessage, m, onChunk)
  }
  if (provider.id === 'groq-custom') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé Groq manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callGroqStream(key, systemPrompt, history, userMessage, m, onChunk)
  }
  if (provider.id === 'openai') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé OpenAI manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callOpenAIStream(key, systemPrompt, history, userMessage, m, onChunk)
  }
  if (provider.id === 'anthropic') {
    const key = pref.apiKey?.trim()
    if (!key) throw new Error('Clé Anthropic manquante — configurez-la dans Paramètres → Moteur IA.')
    return _callAnthropicStream(key, systemPrompt, history, userMessage, m, onChunk)
  }
  // Unknown provider — fallback to non-streaming
  const reply = await askAI(systemPrompt, history, userMessage, model)
  onChunk(reply, reply)
  return reply
}

async function _callGroqStream(apiKey, systemPrompt, history, userMessage, model, onChunk) {
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true })
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: userMessage },
  ]
  const stream = await client.chat.completions.create({ model, messages, max_tokens: 4096, stream: true })
  let full = ''
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || ''
    if (token) { full += token; onChunk(token, full) }
  }
  return full
}

async function _callOpenAIStream(apiKey, systemPrompt, history, userMessage, model, onChunk) {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: userMessage },
  ]
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 4096, stream: true }),
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

async function _callAnthropicStream(apiKey, systemPrompt, history, userMessage, model, onChunk) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model, max_tokens: 4096, stream: true,
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
