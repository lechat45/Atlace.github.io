import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-white text-black hover:bg-gray-100',
  ghost: 'bg-transparent border border-white/10 text-white/80 hover:border-white/25 hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30',
  success: 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function GlassButton({
  children, onClick, variant = 'ghost', size = 'md',
  disabled = false, className = '', type = 'button', loading = false,
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className={`
        ripple inline-flex items-center gap-2 rounded-xl font-dm font-medium
        transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : children}
    </motion.button>
  )
}
