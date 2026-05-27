import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = true, onClick, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? {
        y: -4,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
        borderColor: 'rgba(255,255,255,0.20)',
      } : {}}
      onClick={onClick}
      className={`glass p-6 cursor-${onClick ? 'pointer' : 'default'} ${className}`}
    >
      {children}
    </motion.div>
  )
}
