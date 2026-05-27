import { useState } from 'react'
import GlassInput from '../ui/GlassInput'
import GlassButton from '../ui/GlassButton'

const SERVICES = ['google', 'openai', 'anthropic', 'autre']

export default function ApiKeyForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    service: initial.service || 'google',
    keyValue: '',
    description: initial.description || '',
  })

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <GlassInput label="Nom" value={form.name} onChange={set('name')} placeholder="ex: Gemini Pro Key" required />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-syne font-bold uppercase tracking-widest text-white/50">Service</label>
        <select
          value={form.service}
          onChange={set('service')}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white/90 font-dm text-sm focus:outline-none focus:border-white/30 transition-all"
        >
          {SERVICES.map(s => (
            <option key={s} value={s} className="bg-[#0a0a10]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <GlassInput
        label={initial.id ? 'Nouvelle clé (laissez vide pour garder)' : 'Clé API'}
        type="password"
        value={form.keyValue}
        onChange={set('keyValue')}
        placeholder="sk-••••••••••••••••••••"
        required={!initial.id}
      />

      <GlassInput
        label="Description"
        textarea
        rows={3}
        value={form.description}
        onChange={set('description')}
        placeholder="Description optionnelle..."
      />

      <div className="flex justify-end gap-3 pt-2">
        <GlassButton type="button" onClick={onCancel} variant="ghost">Annuler</GlassButton>
        <GlassButton type="submit" variant="primary" loading={loading}>
          {initial.id ? 'Enregistrer' : 'Ajouter la clé'}
        </GlassButton>
      </div>
    </form>
  )
}
