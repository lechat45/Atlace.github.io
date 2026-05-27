import { motion } from 'framer-motion'
import { Terminal, ExternalLink } from 'lucide-react'

const types = [
  {
    id: 'executable',
    icon: Terminal,
    label: 'Projet Exécutable',
    desc: 'Créez et exécutez du code directement dans ATLACE. HTML, CSS, JS, Python. Assisté par IA.',
    color: 'blue',
  },
  {
    id: 'external',
    icon: ExternalLink,
    label: 'Projet Externe',
    desc: "Référencez un projet existant. Stockez ses clés API et informations sans écrire de code.",
    color: 'default',
  },
]

export default function ProjectTypeSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {types.map(({ id, icon: Icon, label, desc, color }, i) => {
        const isSelected = selected === id
        return (
          <motion.button
            key={id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onSelect(id)}
            className={`
              glass flex flex-col items-center gap-3 p-6 text-center
              transition-all duration-200 cursor-pointer
              ${isSelected
                ? color === 'blue'
                  ? 'border-blue-400/50 bg-blue-500/10'
                  : 'border-white/30 bg-white/8'
                : 'hover:border-white/20 hover:bg-white/5'
              }
            `}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isSelected
                ? color === 'blue' ? 'bg-blue-500/30 border border-blue-400/40' : 'bg-white/15 border border-white/20'
                : 'bg-white/8 border border-white/10'
            }`}>
              <Icon size={24} className={
                isSelected
                  ? color === 'blue' ? 'text-blue-300' : 'text-white'
                  : 'text-white/40'
              } />
            </div>
            <div>
              <p className={`font-syne font-bold text-sm tracking-wide ${isSelected ? 'text-white' : 'text-white/60'}`}>
                {label}
              </p>
              <p className="text-xs font-dm text-white/35 mt-1 leading-relaxed">{desc}</p>
            </div>
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-white/70 mt-1" />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
