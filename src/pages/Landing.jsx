import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AnimatedGlobe from '../components/globe/AnimatedGlobe'
import GlassButton from '../components/ui/GlassButton'
import { LOGO_SRC } from '../lib/assets'

const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 4,
  duration: 2 + Math.random() * 3,
}))

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#050508' }}>

      {/* Orbs */}
      <div className="orb-1" />
      <div className="orb-2" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '70px 70px',
        }}
      />

      {/* Stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animation: `pulseDot ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center gap-8 text-center px-4 max-w-lg"
      >
        {/* Globe + logo */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <AnimatedGlobe size={160} />
          {/* Logo overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute -bottom-4 -right-4 w-14 h-14 rounded-2xl overflow-hidden"
            style={{
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(139,92,246,0.3)',
            }}
          >
            <img src={LOGO_SRC} alt="ATLACE" className="w-full h-full object-cover" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="flex flex-col items-center gap-2"
        >
          <h1 className="font-syne font-extrabold tracking-[0.3em] uppercase"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              background: 'linear-gradient(135deg, #ffffff 30%, #c4b5fd 70%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            ATLACE
          </h1>
          <p className="font-syne text-[11px] tracking-[0.5em] uppercase"
            style={{ color: 'rgba(167,139,250,0.7)' }}>
            YOUR AI COMMAND CENTER
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-dm text-sm leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.32)' }}
        >
          Centralisez vos clés API, gérez vos projets web et interagissez
          avec Groq AI dans un seul espace unifié.
        </motion.p>

        {/* Features pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {['🔑 Clés API chiffrées', '⚡ Groq AI intégré', '💻 Éditeur de code', '🚀 100% gratuit'].map(f => (
            <span key={f} className="text-xs font-dm px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
              {f}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72, duration: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.button
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="ripple px-10 py-3.5 rounded-2xl font-syne font-bold tracking-[0.25em] uppercase text-sm text-black"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #e2d9ff 100%)',
              boxShadow: '0 0 40px rgba(167,139,250,0.4), 0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            ENTER
          </motion.button>
          <p className="text-[11px] font-dm" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Supabase · Groq AI · Open Source
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
