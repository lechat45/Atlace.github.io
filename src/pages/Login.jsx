import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Icon from '../components/icons/Icon'

function Logomark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="lg-auth" x1="0" x2="24" y1="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="1"/>
          <stop offset="1" stopColor="#fff" stopOpacity="0.6"/>
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
      <path d="M6 18 L12 5 L18 18 M8.5 13 L15.5 13" stroke="url(#lg-auth)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20" cy="4.5" r="1.2" fill="var(--accent)"/>
    </svg>
  )
}

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
      minHeight: "100vh", display: "grid", placeItems: "center",
      background: "var(--bg-deep)", position: "relative", overflow: "hidden",
    }}>
      {/* Background */}
      <div className="app-bg"/>
      <div className="orb orb-1" style={{ width: 480, height: 480, top: "-15%", left: "-10%" }}/>
      <div className="orb orb-2" style={{ width: 520, height: 520, bottom: "-20%", right: "-15%" }}/>
      <div className="noise"/>

      {/* Card */}
      <div className="glass" style={{
        width: 420, padding: 32, borderRadius: 18,
        background: "rgba(14,14,22,0.7)", border: "1px solid var(--border-2)",
        boxShadow: "0 30px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px var(--border-shine) inset",
        position: "relative", zIndex: 2,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <Logomark size={26}/>
          <span className="display" style={{ fontSize: 18, letterSpacing: "0.06em" }}>ATLACE</span>
        </div>

        <h1 className="display" style={{ fontSize: 28, margin: "0 0 6px", lineHeight: 1.1 }}>Connexion</h1>
        <p style={{ color: "var(--text-3)", fontSize: 13.5, margin: "0 0 24px" }}>Accédez à votre cockpit IA.</p>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 16,
            background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)",
            color: "var(--danger)", fontSize: 13,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>EMAIL</div>
            <div style={{ position: "relative" }}>
              <Icon name="mail" size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}/>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@atlace.dev"
                style={{ paddingLeft: 36, height: 40 }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
              <span className="eyebrow">MOT DE PASSE</span>
            </div>
            <div style={{ position: "relative" }}>
              <Icon name="lock" size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}/>
              <input
                className="input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: 36, paddingRight: 38, height: 40 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(s => !s)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}
              >
                <Icon name={showPwd ? "eyeOff" : "eye"} size={14}/>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", height: 42, fontSize: 14 }}
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
            {!loading && <Icon name="chevronR" size={13}/>}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12.5, color: "var(--text-3)" }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: "var(--text-1)", textDecoration: "none", borderBottom: "1px dotted var(--text-2)" }}>
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}
