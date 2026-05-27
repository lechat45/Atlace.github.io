import { GoogleGenerativeAI } from '@google/generative-ai'

// Modèles disponibles — essayez dans l'ordre si erreur quota
export const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B ✅' },
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite ✅' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
]

export const DEFAULT_MODEL = 'gemini-1.5-flash-8b'

export async function askGemini(apiKey, systemPrompt, conversationHistory, userMessage, model = DEFAULT_MODEL) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt || undefined,
  })
  const chat = generativeModel.startChat({ history: conversationHistory })
  const result = await chat.sendMessage(userMessage)
  return result.response.text()
}

export async function testGeminiKey(apiKey, model = DEFAULT_MODEL) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const generativeModel = genAI.getGenerativeModel({ model })
  const result = await generativeModel.generateContent('Hello')
  return result.response.text()
}

export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4)
}

export function parseGeminiError(err, currentModel) {
  const msg = err?.message || String(err)
  if (msg.includes('429') || msg.includes('quota') || msg.includes('limit: 0')) {
    return `🔑 Clé API sans accès à "${currentModel || 'ce modèle'}".

Essayez ceci :
1. Changez de modèle dans le sélecteur (essayez Gemini 1.5 Flash 8B)
2. Ou créez une nouvelle clé sur aistudio.google.com/apikey (cliquez "Get API Key")`
  }
  if (msg.includes('404')) {
    return '❌ Modèle introuvable. Sélectionnez "Gemini 1.5 Flash 8B" dans la liste.'
  }
  if (msg.includes('401') || msg.includes('403') || msg.includes('API_KEY') || msg.includes('API key')) {
    return '🔑 Clé API invalide. Vérifiez votre clé dans "Clés API" de l\'app.'
  }
  return `Erreur Gemini : ${msg.split('\n')[0]}`
}
