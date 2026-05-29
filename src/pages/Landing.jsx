import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import AnimatedGlobe from '../components/globe/AnimatedGlobe'
import { LOGO_SRC } from '../lib/assets'

/* ── Floating particles ──────────────────────────────────────── */
const PARTICLES = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  opacity: Math.random() * 0.5 + 0.1,
  delay: Math.random() * 6,
  duration: 3 + Math.random() * 5,
}))

/* ── Typing animation ────────────────────────────────────────── */
const WORDS = ['Intelligence', 'Créativité', 'Productivité']
function TypingWord() {
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const target = WORDS[idx]
    const speed = deleting ? 40 : 70
    const timer = setTimeout(() => {
      if (!deleting && text.length < target.length) {
        setText(target.slice(0, text.length + 1))
      } else if (!deleting && text.length === target.length) {
        setTimeout(() => setDeleting(true), 1800)
      } else if (deleting && text.length > 0) {
        setText(text.slice(0, -1))
      } else if (deleting && text.length === 0) {
        setDeleting(false)
        setIdx(i => (i + 1) % WORDS.length)
      }
    }, speed)
    return () => clearTimeout(timer)
  }, [text, deleting, idx])

  return (
    <span style={{
      background: 'linear-gradient(135deg, var(--accent) 0%, #6bff9e 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      borderRight: '2px solid var(--accent)', paddingRight: 4,
      animation: 'cursorBlink 1s ease-in-out infinite',
    }}>
      {text}
    </span>
  )
}

/* ── Feature card ────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: '18px 20px',
        borderRadius: 16,
        border: '1px solid var(--border-1)',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: 'default',
        transition: 'border-color 200ms, transform 200ms',
      }}
      whileHover={{ borderColor: 'rgba(200,255,77,0.25)', y: -2 }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(200,255,77,0.15), rgba(107,255,158,0.08))',
        border: '1px solid rgba(200,255,77,0.2)',
        display: 'grid', placeItems: 'center',
        fontSize: 18,
      }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>
    </motion.div>
  )
}

/* ── Main ────────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 30)
      mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 20)
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh', overflowX: 'hidden',
        background: '#050508', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
    >
      {/* Background layers */}
      <div className="app-bg" />
      <div className="noise" />

      {/* Gradient orbs */}
      <motion.div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        x: springX, y: springY,
      }}>
        <div className="orb orb-1" style={{ width: 700, height: 700, top: '-20%', left: '-15%', opacity: 0.35 }} />
        <div className="orb orb-2" style={{ width: 600, height: 600, bottom: '-25%', right: '-18%', opacity: 0.28 }} />
      </motion.div>

      {/* Particles */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {PARTICLES.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: '50%', background: 'white',
            opacity: p.opacity,
            animation: `pulseDot ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* Topbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          background: 'rgba(5,5,8,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(200,255,77,0.2), rgba(107,255,158,0.1))',
            border: '1px solid rgba(200,255,77,0.3)',
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 18 L12 5 L18 18 M8.5 13 L15.5 13" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, letterSpacing: '0.08em' }}>ATLACE</span>
          <span style={{
            marginLeft: 4, fontSize: 10, fontFamily: 'Fira Code',
            color: 'var(--accent)', border: '1px solid rgba(200,255,77,0.3)',
            padding: '2px 6px', borderRadius: 4, letterSpacing: '0.08em',
          }}>v1.0</span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              height: 34, padding: '0 16px',
              border: '1px solid var(--border-1)',
              background: 'var(--surface-1)',
              color: 'var(--text-2)', borderRadius: 8,
              fontSize: 13, cursor: 'pointer',
              fontFamily: 'DM Sans',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border-1)' }}
          >
            Connexion
          </button>
          <motion.button
            onClick={() => navigate('/register')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              height: 34, padding: '0 16px',
              background: 'var(--accent)', color: 'var(--accent-ink)',
              border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'DM Sans',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}
          >
            Commencer →
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '160px 24px 80px',
        maxWidth: 900, width: '100%',
      }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(200,255,77,0.08)',
            border: '1px solid rgba(200,255,77,0.25)',
            color: 'var(--accent)', fontSize: 12,
            fontFamily: 'Fira Code', letterSpacing: '0.04em',
            marginBottom: 32,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)', display: 'inline-block' }} />
          Propulsé par Groq LPU · 100% gratuit
        </motion.div>

        {/* Globe */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 40, position: 'relative' }}
        >
          <div style={{
            position: 'absolute', inset: -40,
            background: 'radial-gradient(circle, rgba(200,255,77,0.08) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />
          <AnimatedGlobe size={180} />
          {/* Logo chip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{
              position: 'absolute', bottom: -12, right: -16,
              width: 52, height: 52, borderRadius: 14, overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(139,92,246,0.3)',
            }}
          >
            <img src={LOGO_SRC} alt="ATLACE" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: 'clamp(3rem, 9vw, 5.5rem)',
            fontFamily: 'Syne', fontWeight: 800,
            lineHeight: 1.05, letterSpacing: '-0.02em',
            margin: '0 0 8px',
            background: 'linear-gradient(160deg, #fff 30%, rgba(255,255,255,0.55) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}
        >
          ATLACE
        </motion.h1>

        {/* Subtitle with typing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
            fontFamily: 'DM Sans', fontWeight: 300,
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 28,
            letterSpacing: '-0.01em',
          }}
        >
          L'IA pour votre <TypingWord />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          style={{
            fontSize: 15, lineHeight: 1.7,
            color: 'rgba(255,255,255,0.32)',
            maxWidth: 520, margin: '0 auto 40px',
          }}
        >
          Centralisez vos clés API, gérez vos projets et interagissez avec les meilleurs modèles IA dans un espace unifié, sécurisé et gratuit.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.button
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(200,255,77,0.5)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                height: 52, padding: '0 32px',
                background: 'linear-gradient(135deg, var(--accent) 0%, #9eff52 100%)',
                color: 'var(--accent-ink)', border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 700, fontFamily: 'Syne',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 0 30px var(--accent-glow), 0 4px 24px rgba(0,0,0,0.4)',
                transition: 'box-shadow 200ms',
              }}
            >
              Commencer gratuitement
            </motion.button>
            <motion.button
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.25)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                height: 52, padding: '0 28px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 14, fontSize: 14,
                fontFamily: 'DM Sans', cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              J'ai déjà un compte →
            </motion.button>
          </div>
          <p style={{ fontSize: 11.5, fontFamily: 'Fira Code', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
            Sans carte bancaire · Supabase · Open Source
          </p>
        </motion.div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 700,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, margin: '0 0 64px',
          border: '1px solid var(--border-1)',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--border-1)',
        }}
      >
        {[
          { num: '118ms', label: 'Latence Groq LPU', icon: '⚡' },
          { num: '∞',     label: 'Tokens gratuits',   icon: '🪙' },
          { num: '100%',  label: 'Open Source',        icon: '🔓' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(10,10,17,0.8)',
            padding: '20px 24px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
          }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontFamily: 'Syne', fontWeight: 800, color: 'var(--text-1)' }}>{s.num}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'Fira Code', letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </motion.section>

      {/* ── Features grid ────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 900,
        padding: '0 24px 120px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <p style={{ fontFamily: 'Fira Code', fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>FONCTIONNALITÉS</p>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', margin: 0, color: 'var(--text-1)' }}>
            Tout ce dont vous avez besoin
          </h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <FeatureCard delay={1.0} icon="🔑" title="Vault de clés API" desc="Stockage chiffré de vos clés avec AES. Accédez à OpenAI, Anthropic, Groq depuis un seul endroit." />
          <FeatureCard delay={1.1} icon="⚡" title="Groq LPU intégré" desc="Réponses en millisecondes grâce aux LPU de Groq. Llama, Mistral, Gemma disponibles." />
          <FeatureCard delay={1.2} icon="💻" title="Éditeur de code IA" desc="Monaco Editor avec diff inline. Proposez des modifications, acceptez ou refusez fichier par fichier." />
          <FeatureCard delay={1.3} icon="🤖" title="Agent autonome" desc="L'agent analyse votre projet, planifie les modifications et implémente le tout avant de vous montrer les diffs." />
          <FeatureCard delay={1.4} icon="🔒" title="100% sécurisé" desc="Auth Supabase, données chiffrées côté client. Vos clés ne quittent jamais votre navigateur en clair." />
          <FeatureCard delay={1.5} icon="🚀" title="Déploiement zéro" desc="Hébergé sur GitHub Pages. Pas de serveur à gérer, pas d'infra à maintenir." />
        </div>
      </section>

      <style>{`
        @keyframes cursorBlink {
          0%, 100% { border-color: var(--accent); }
          50% { border-color: transparent; }
        }
      `}</style>
    </div>
  )
}
