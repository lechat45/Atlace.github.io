import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useApiKeys } from '../hooks/useApiKeys'
import { askGroq } from '../lib/groq'
import ApiKeyCard from '../components/apikeys/ApiKeyCard'
import ApiKeyForm from '../components/apikeys/ApiKeyForm'
import GlassModal from '../components/ui/GlassModal'
import GlassButton from '../components/ui/GlassButton'
import TopBar from '../components/layout/TopBar'
import { useToast } from '../components/ui/Toast'

const FILTERS = ['Toutes', 'Actives', 'google', 'openai', 'anthropic', 'autre']

export default function ApiKeys() {
  const { user } = useAuth()
  const { keys, loading, addKey, updateKey, deleteKey, getDecryptedKey, incrementUsage } = useApiKeys(user?.id)
  const toast = useToast()
  const [filter, setFilter] = useState('Toutes')
  const [modalOpen, setModalOpen] = useState(false)
  const [editKey, setEditKey] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const filtered = keys.filter(k => {
    if (filter === 'Toutes') return true
    if (filter === 'Actives') return k.is_active
    return k.service === filter
  })

  async function handleSubmit(form) {
    setSubmitting(true)
    try {
      if (editKey) {
        await updateKey(editKey.id, form)
        toast('Clé mise à jour', 'success')
      } else {
        await addKey(form)
        toast('Clé ajoutée avec succès', 'success')
      }
      setModalOpen(false)
      setEditKey(null)
    } catch (err) {
      toast(err.message, 'error')
    }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette clé API ?')) return
    try {
      await deleteKey(id)
      toast('Clé supprimée', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function handleTest(apiKey) {
    try {
      toast('Test en cours...', 'info')
      await askGroq('Tu es un assistant.', [], 'ping', 'llama-3.1-8b-instant')
      toast('✓ Groq AI fonctionne correctement', 'success')
    } catch (err) {
      toast(`Erreur Groq: ${err.message}`, 'error')
    }
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <TopBar
        title="Clés API"
        subtitle={`${keys.length} clé${keys.length > 1 ? 's' : ''} enregistrée${keys.length > 1 ? 's' : ''}`}
        actions={
          <GlassButton variant="primary" onClick={() => { setEditKey(null); setModalOpen(true) }}>
            <Plus size={16} /> Nouvelle clé
          </GlassButton>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-dm font-medium border transition-all ${
              filter === f
                ? 'bg-white/12 border-white/25 text-white'
                : 'bg-white/3 border-white/8 text-white/40 hover:border-white/15 hover:text-white/60'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass p-12 text-center">
          <p className="text-4xl mb-4">🔑</p>
          <p className="font-syne font-bold text-white/50 text-lg mb-2">Aucune clé API</p>
          <p className="text-sm font-dm text-white/30 mb-6">
            {filter === 'Toutes' ? 'Ajoutez votre première clé API pour commencer' : `Aucune clé pour le filtre "${filter}"`}
          </p>
          {filter === 'Toutes' && (
            <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Ajouter une clé
            </GlassButton>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((key, i) => (
            <ApiKeyCard
              key={key.id}
              apiKey={key}
              delay={i * 0.04}
              getDecrypted={getDecryptedKey}
              onEdit={k => { setEditKey(k); setModalOpen(true) }}
              onDelete={handleDelete}
              onTest={handleTest}
            />
          ))}
        </div>
      )}

      <GlassModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditKey(null) }}
        title={editKey ? 'Modifier la clé' : 'Nouvelle clé API'}
      >
        <ApiKeyForm
          initial={editKey || {}}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditKey(null) }}
          loading={submitting}
        />
      </GlassModal>
    </div>
  )
}
