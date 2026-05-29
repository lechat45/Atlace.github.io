import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import Icon from '../components/icons/Icon'

/* ── Password strength ───────────────────────────────────────── */
function PasswordStrength({ password }) {
  const checks = [
    { label: '6+ caractères', ok: password.length >= 6 },
    { label: 'Majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Chiffre', ok: /\d/.test(password) },
    { label: 'Symbole', ok: /[^a-zA-Z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const color = score <= 1 ? '#ff6b6b' : score <= 2 ? '#ffcb5e' : score <= 3 ? '#6bff9e' : 'var(--accent)'
  const label = score === 0 ? '' : score <= 1 ? 'Faible' : score <= 2 ? 'Moyen' : score <= 3 ? 'Fort' : 'Excellent'

  if (!password) return null
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? color : 'var(--surface-2)',
            transition: 'background 300ms',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: 10.5, fontFamily: 'Fira Code', color: c.ok ? 'var(--accent)' : 'var(--text-4)' }}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {label && <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>}
      </div>
    </div>
  )
}

/* ── Brand panel ─────────────────────────────────────────────── */
function BrandPanel() {
  return (
    <div style={{
      flex: '0 0 420px',
      background: 'linear-gradient(160deg, #0a0a16 0%, #050508 60%, #07060e 100%)',
      borderRight: '1px solid var(--border-1)',
      padding: '48px 40px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div className="orb orb-1" style={{ width: 400, height: 400, top: '-20%', left: '-20%', opacity: 0.4 }} />
        <div className="orb orb-2" style={{ width: 300, height: 300, bottom: '-15%', right: '-15%', opacity: 0.3 }} />
      </div>
      <div className="noise" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Brand */}
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

        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 32, lineHeight: 1.15, margin: '0 0 16px' }}>
          Prêt en<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent), #6bff9e)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>30 secondes.</span>
        </h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14, lineHeight: 1.6, margin: '0 0 40px' }}>
          Créez votre compte gratuitement et commencez à utiliser l'IA immédiatement.
        </p>

        {/* Steps */}
        {[
          { num: '1', title: 'Créez votre compte', desc: 'Email + mot de passe suffit' },
          { num: '2', title: 'Ajoutez vos clés API', desc: 'Chiffrées et sécurisées' },
          { num: '3', title: 'Discutez avec l\'IA', desc: 'Groq inclus, zéro configuration' },
        ].map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.4 }}
            style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(200,255,77,0.2), rgba(107,255,158,0.1))',
              border: '1px solid rgba(200,255,77,0.25)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: 'var(--accent)',
            }}>{step.num}</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{step.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ height: 1, background: 'var(--border-0)', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['100% Gratuit', 'Chiffrement AES', 'No spam'].map(t => (
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

/* ── Register page ───────────────────────────────────────────── */
export default function Register() {
  const navigate = useNavigate()
  const { signUp, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return }
    setError('')
    setLoading(true)
    try {
      const { session } = await signUp(email, password)
      if (session) { navigate('/dashboard'); return }
      try {
        await signIn(email, password)
        navigate('/dashboard')
      } catch {
        navigate('/login')
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du compte')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden',
    }}>
      <div className="app-bg" />

      <BrandPanel />

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
          <h1 className="display" style={{ fontSize: 32, margin: '0 0 6px', lineHeight: 1.1 }}>Créer un compte</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 32px' }}>
            Rejoignez ATLACE — c'est gratuit et immédiat.
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
            {/* Name */}
            <div>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 7 }}>NOM D'AFFICHAGE</label>
              <div style={{ position: 'relative' }}>
                <Icon name="user" size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}/>
                <input
                  className="input"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Votre prénom"
                  style={{ paddingLeft: 38, height: 44, borderRadius: 10 }}
                  autoFocus
                />
              </div>
            </div>

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
                  required
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
                  placeholder="Min. 6 caractères"
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
              <PasswordStrength password={password} />
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
                  Création du compte…
                </>
              ) : (
                <>Créer mon compte <Icon name="chevronR" size={14}/></>
              )}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-3)' }}>
            Déjà inscrit ?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Se connecter →
            </Link>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-4)', fontFamily: 'Fira Code', lineHeight: 1.5 }}>
            En créant un compte, vous acceptez nos conditions d'utilisation.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
