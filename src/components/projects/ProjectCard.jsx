import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Terminal, ExternalLink, Archive, Trash2, Clock } from 'lucide-react'
import GlassBadge from '../ui/GlassBadge'

export default function ProjectCard({ project, onArchive, onDelete, delay = 0 }) {
  const navigate = useNavigate()
  const isExecutable = project.type === 'executable'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass p-5 flex flex-col gap-3 hover:border-white/20 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isExecutable ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/8 border border-white/10'
          }`}>
            {isExecutable
              ? <Terminal size={18} className="text-blue-300" />
              : <ExternalLink size={18} className="text-white/40" />
            }
          </div>
          <div>
            <p className="font-syne font-bold text-sm text-white tracking-wide">{project.name}</p>
            <GlassBadge color={isExecutable ? 'blue' : 'gray'} className="mt-0.5">
              {isExecutable ? '🚀 Exécutable' : '🔗 Externe'}
            </GlassBadge>
          </div>
        </div>
        <GlassBadge color={project.status === 'active' ? 'green' : 'gray'}>
          {project.status === 'active' ? 'Actif' : 'Archivé'}
        </GlassBadge>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs font-dm text-white/45 line-clamp-2">{project.description}</p>
      )}

      {/* Technologies */}
      {project.technologies?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.technologies.slice(0, 4).map(t => (
            <GlassBadge key={t}>{t}</GlassBadge>
          ))}
          {project.technologies.length > 4 && (
            <GlassBadge>+{project.technologies.length - 4}</GlassBadge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center gap-1 text-xs text-white/30 font-dm">
          <Clock size={12} />
          {new Date(project.updated_at || project.created_at).toLocaleDateString('fr-FR')}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="px-3 py-1.5 rounded-lg text-xs font-dm font-medium bg-white/8 hover:bg-white/15 text-white/80 hover:text-white transition-all"
          >
            Ouvrir
          </button>
          {project.status === 'active' && (
            <button
              onClick={() => onArchive(project.id)}
              className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center transition-colors group"
              title="Archiver"
            >
              <Archive size={13} className="text-white/30 group-hover:text-white/60" />
            </button>
          )}
          <button
            onClick={() => onDelete(project.id)}
            className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors group"
            title="Supprimer"
          >
            <Trash2 size={13} className="text-white/30 group-hover:text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
