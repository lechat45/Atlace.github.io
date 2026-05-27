const colorMap = {
  default: 'bg-white/10 text-white/70 border-white/10',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  green: 'bg-green-500/20 text-green-300 border-green-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  gray: 'bg-white/5 text-white/40 border-white/8',
}

export default function GlassBadge({ children, color = 'default', onClick, className = '' }) {
  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-dm font-medium
        border transition-all duration-150
        ${colorMap[color]}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
