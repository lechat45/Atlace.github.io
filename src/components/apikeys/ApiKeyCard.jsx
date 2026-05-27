import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Copy, Check, MoreVertical, Trash2, Edit, Zap } from 'lucide-react'
import GlassBadge from '../ui/GlassBadge'
import { useToast } from '../ui/Toast'

const SERVICE_ICONS = {
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  openai: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.032.067L9.76 19.95a4.5 4.5 0 0 1-6.16-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.392.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  ),
  anthropic: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
      <path d="M17.3 3.2L22 20.8h-3.8l-.9-3.2h-5.4l-.9 3.2H8l4.7-17.6h4.6zm-1.2 11.2l-1.8-6.6-1.8 6.6h3.6zM6.7 3.2H3L0 20.8h3.6l.6-2.4 2.5 2.4 2.5-2.4.6 2.4H13L10 3.2H6.7z"/>
    </svg>
  ),
  autre: (
    <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-bold text-white">
      ?
    </div>
  ),
}

export default function ApiKeyCard({ apiKey, onEdit, onDelete, onTest, getDecrypted, delay = 0 }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const toast = useToast()

  const decrypted = revealed ? getDecrypted(apiKey) : null
  const masked = '••••••••••••••••••••'

  async function handleCopy() {
    const val = getDecrypted(apiKey)
    await navigator.clipboard.writeText(val)
    setCopied(true)
    toast('Clé copiée !', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass p-5 flex flex-col gap-3 hover:border-white/20 transition-all duration-200"
      style={{ cursor: 'default' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {SERVICE_ICONS[apiKey.service] || SERVICE_ICONS.autre}
          <div>
            <p className="font-syne font-bold text-white text-sm tracking-wide">{apiKey.name}</p>
            <p className="text-xs font-dm text-white/40 capitalize">{apiKey.service}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassBadge color={apiKey.is_active ? 'green' : 'red'}>
            {apiKey.is_active ? 'Actif' : 'Inactif'}
          </GlassBadge>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center transition-colors"
            >
              <MoreVertical size={15} className="text-white/40" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 glass rounded-xl overflow-hidden min-w-[140px] py-1">
                  <button onClick={() => { onEdit(apiKey); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-dm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <Edit size={14} /> Modifier
                  </button>
                  <button onClick={() => { onTest(apiKey); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-dm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                    <Zap size={14} /> Tester
                  </button>
                  <button onClick={() => { onDelete(apiKey.id); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-dm text-red-400 hover:bg-red-500/8 transition-colors">
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Key display */}
      <div className="flex items-center gap-2 bg-white/3 rounded-xl px-3 py-2">
        <code className="flex-1 font-fira text-xs text-white/60 truncate">
          {revealed ? decrypted : masked}
        </code>
        <button onClick={() => setRevealed(!revealed)}
          className="text-white/30 hover:text-white/70 transition-colors">
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button onClick={handleCopy}
          className="text-white/30 hover:text-white/70 transition-colors">
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Description */}
      {apiKey.description && (
        <p className="text-xs font-dm text-white/40 line-clamp-2">{apiKey.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs font-dm text-white/30">
        <span>{apiKey.usage_count || 0} utilisations</span>
        <span>{new Date(apiKey.created_at).toLocaleDateString('fr-FR')}</span>
      </div>
    </motion.div>
  )
}
