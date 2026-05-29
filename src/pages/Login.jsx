import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import Icon from '../components/icons/Icon'

/* ── Brand panel (left side) ─────────────────────────────────── */
function BrandPanel() {
  const features = [
    { icon: '⚡', text: 'Groq LPU — réponses en ~118ms' },
    { icon: '🔑', text: 'Vault de clés API chiffrées AES' },
    { icon: '💻', text: 'Éditeur de code avec diff IA inline' },
    { icon: '🤖', text: 'Agent autonome full-stack' },
  ]
  return (
    <div style={{
      flex: '0 0 420px',
      background: 'linear-gradient(160deg, #0a0a16 0%, #050508 60%, #0d0710 100%)',
      borderRight: '1px solid var(--border-1)',
      padding: '48px 40px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div className="orb orb-1" style={{ width: 400, height: 400, top: '-20%', left: '-20%', opacity: 0.4 }} />
        <div className="orb orb-2" style={{ width: 300, height: 300, bottom: '-15%', right: '-15%', opacity: 0.3 }} />
      </div>
      <div className="noise" />

      {/* Brand */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(200,255,77,0.2), rgba(107,255,158,0.1))',
            border: '1px solid rgba(200,255,77,0.3)',
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 18 L12 5 L18 18 M8.5 13 L15.5 13" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, letterSpacing: '0.06em' }}>ATLACE</span>
        </div>

        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 32, lineHeight: 1.15, margin: '0 0 16px', color: 'var(--text-1)' }}>
          Votre cockpit<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent), #6bff9e)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>IA centralisé.</span>
        </h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14, lineHeight: 1.6, margin: '0 0 40px' }}>
          Accédez à tous vos outils IA depuis un seul espace sécurisé.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-1)',
                display: 'grid', placeItems: 'center', fontSize: 15,
              }}>{f.icon}</div>
              <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{f.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ height: 1, background: 'var(--border-0)', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Supabase', 'Groq LPU', 'Monaco Editor', 'Open Source'].map(t => (
            <span key={t} style={{
              fontSize: 10.5, fontFamily: 'Fira Code',
              color: 'var(--text-4)', padding: '3px 8px',
              border: '1px solid var(--border-0)',
              borderRadius: 4, letterSpacing: '0.04em',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Login page ──────────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Identifiants incorrects')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden',
    }}>
      <div className="app-bg" />

      {/* Left brand panel */}
      <BrandPanel />

      {/* Right form panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 32px', position: 'relative', zIndex: 2,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          <h1 className="display" style={{ fontSize: 32, margin: '0 0 6px', lineHeight: 1.1 }}>Connexion</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 32px' }}>
            Bon retour — accédez à votre cockpit.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 20,
                background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)',
                color: 'var(--danger)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Icon name="x" size={13} /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 7 }}>EMAIL</label>
              <div style={{ position: 'relative' }}>
                <Icon name="mail" size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}/>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@domaine.com"
                  style={{ paddingLeft: 38, height: 44, borderRadius: 10 }}
                  required autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 7 }}>MOT DE PASSE</label>
              <div style={{ position: 'relative' }}>
                <Icon name="lock" size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}/>
                <input
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 38, paddingRight: 42, height: 44, borderRadius: 10 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}
                >
                  <Icon name={showPwd ? 'eyeOff' : 'eye'} size={14}/>
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              style={{
                marginTop: 4,
                height: 48, borderRadius: 12,
                background: loading ? 'var(--surface-2)' : 'var(--accent)',
                color: loading ? 'var(--text-2)' : 'var(--accent-ink)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 200ms',
                boxShadow: loading ? 'none' : '0 0 24px var(--accent-glow)',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--text-1)', animation: 'spin 0.7s linear infinite' }} />
                  Connexion…
                </>
              ) : (
                <>Se connecter <Icon name="chevronR" size={14}/></>
              )}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-3)' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Créer un compte →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
