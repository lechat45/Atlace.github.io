import { useState } from 'react'
import { X } from 'lucide-react'
import GlassInput from '../ui/GlassInput'
import GlassButton from '../ui/GlassButton'
import GlassBadge from '../ui/GlassBadge'

const LANGUAGES = ['HTML/JS/CSS', 'Python', 'Node.js']

export default function ProjectForm({ type, apiKeys = [], onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    technologies: [],
    apiKeyIds: [],
    mainLanguage: 'HTML/JS/CSS',
    externalUrl: '',
    notes: '',
  })
  const [techInput, setTechInput] = useState('')

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  function addTech(e) {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault()
      setForm(prev => ({ ...prev, technologies: [...new Set([...prev.technologies, techInput.trim()])] }))
      setTechInput('')
    }
  }

  function removeTech(t) {
    setForm(prev => ({ ...prev, technologies: prev.technologies.filter(x => x !== t) }))
  }

  function toggleApiKey(id) {
    setForm(prev => ({
      ...prev,
      apiKeyIds: prev.apiKeyIds.includes(id)
        ? prev.apiKeyIds.filter(x => x !== id)
        : [...prev.apiKeyIds, id],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ ...form, type })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <GlassInput label="Nom du projet" value={form.name} onChange={set('name')} placeholder="Mon projet IA" required />
      <GlassInput label="Description" textarea rows={3} value={form.description} onChange={set('description')} placeholder="Description..." />

      {type === 'external' && (
        <GlassInput label="URL du projet" type="url" value={form.externalUrl} onChange={set('externalUrl')} placeholder="https://github.com/..." />
      )}

      {type === 'executable' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-syne font-bold uppercase tracking-widest text-white/50">Langage principal</label>
          <div className="flex gap-2">
            {LANGUAGES.map(lang => (
              <button key={lang} type="button" onClick={() => setForm(p => ({ ...p, mainLanguage: lang }))}
                className={`flex-1 py-2 rounded-xl text-xs font-dm font-medium border transition-all ${
                  form.mainLanguage === lang
                    ? 'bg-blue-500/20 border-blue-400/40 text-blue-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}>
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Technologies */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-syne font-bold uppercase tracking-widest text-white/50">Technologies</label>
        <input
          value={techInput}
          onChange={e => setTechInput(e.target.value)}
          onKeyDown={addTech}
          placeholder="Tapez + Entrée pour ajouter..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white/90 font-dm text-sm focus:outline-none focus:border-white/30"
        />
        {form.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {form.technologies.map(t => (
              <GlassBadge key={t} className="cursor-pointer" onClick={() => removeTech(t)}>
                {t} <X size={10} />
              </GlassBadge>
            ))}
          </div>
        )}
      </div>

      {/* API Keys */}
      {apiKeys.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-syne font-bold uppercase tracking-widest text-white/50">Clés API associées</label>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {apiKeys.map(key => (
              <label key={key.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.apiKeyIds.includes(key.id)}
                  onChange={() => toggleApiKey(key.id)}
                  className="accent-white"
                />
                <span className="text-sm font-dm text-white/70">{key.name}</span>
                <span className="text-xs font-dm text-white/30 ml-auto capitalize">{key.service}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <GlassButton type="button" onClick={onCancel} variant="ghost">Annuler</GlassButton>
        <GlassButton type="submit" variant="primary" loading={loading}>Créer le projet</GlassButton>
      </div>
    </form>
  )
}
