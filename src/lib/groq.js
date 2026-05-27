import Groq from 'groq-sdk'

// Clé Groq — toujours utilisée, quelle que soit la config utilisateur
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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'

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile',        label: 'Llama 3.3 70B (recommandé)' },
  { id: 'llama-3.1-8b-instant',            label: 'Llama 3.1 8B (rapide)' },
  { id: 'deepseek-r1-distill-llama-70b',   label: 'DeepSeek R1 70B (raisonnement)' },
  { id: 'llama-3.2-11b-vision-preview',    label: 'Llama 3.2 11B Vision' },
]

export const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

function getClient() {
  return new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true })
}

export async function askGroq(systemPrompt, conversationHistory, userMessage, model = DEFAULT_MODEL) {
  const client = getClient()
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ]
  const completion = await client.chat.completions.create({ model, messages })
  return completion.choices[0]?.message?.content || ''
}

export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4)
}

export function parseGroqError(err) {
  const msg = err?.message || String(err)
  if (msg.includes('429') || msg.includes('rate_limit')) {
    return '⏳ Limite de débit atteinte. Attendez quelques secondes et réessayez.'
  }
  if (msg.includes('401') || msg.includes('auth') || msg.includes('API key')) {
    return '🔑 Erreur d\'authentification Groq. Contactez l\'administrateur.'
  }
  if (msg.includes('503') || msg.includes('overloaded')) {
    return '🔄 Serveur Groq surchargé. Réessayez dans un instant.'
  }
  return `Erreur : ${msg.split('\n')[0]}`
}
