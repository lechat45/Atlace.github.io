import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useApiKeys } from '../hooks/useApiKeys'
import { useToast } from '../components/ui/Toast'
import { AI_PROVIDERS, getAIPref, setAIPref } from '../lib/ai'
import Icon from '../components/icons/Icon'

// ── Shared helpers ─────────────────────────────────────────
function SectionHeader({ title, sub, actions, inset }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: inset ? "18px 18px 6px" : "20px 24px 14px", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 18, letterSpacing: "-0.01em" }}>{title}</h2>
        {sub && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</span>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>{actions}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = "text", placeholder, mono, right, readOnly }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span className="eyebrow">{label}</span>
        {right}
      </div>
      <input
        className={"input " + (mono ? "mono" : "")}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ opacity: readOnly ? 0.6 : 1 }}
      />
    </div>
  )
}

// ── API Key row ────────────────────────────────────────────
function KeyRow({ k, onDelete }) {
  const [shown, setShown] = useState(false)

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto",
      gap: 16, padding: "20px 24px",
      borderBottom: "1px solid var(--border-0)", alignItems: "center",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-1)", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
        <Icon name="key" size={16}/>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{k.name}</span>
          <span className="pill" style={{ height: 18, fontSize: 9.5 }}>{k.service}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
          {k.description || 'Aucune description'} · Créé le {new Date(k.created_at).toLocaleDateString('fr-FR')}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          height: 30, padding: "0 12px",
          border: "1px solid var(--border-1)", borderRadius: 8,
          background: "var(--surface-0)",
          fontFamily: "Fira Code", fontSize: 11.5, color: "var(--text-2)",
          minWidth: 200,
        }}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {shown ? '(chiffré)' : '••••••••••••••••••••••••'}
          </span>
          <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 22, height: 22 }} onClick={() => setShown(s => !s)}>
            <Icon name={shown ? "eyeOff" : "eye"} size={12}/>
          </button>
        </div>
        <button className="btn btn-ghost btn-icon" style={{ color: "var(--danger)" }} onClick={() => onDelete(k.id)}>
          <Icon name="trash" size={13}/>
        </button>
      </div>
    </div>
  )
}

// ── Add key modal ──────────────────────────────────────────
function AddKeyModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [service, setService] = useState('Groq')
  const [keyValue, setKeyValue] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!name.trim() || !keyValue.trim()) return
    setLoading(true)
    await onAdd({ name: name.trim(), service, keyValue: keyValue.trim(), description: description.trim() })
    setLoading(false)
    onClose()
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,2,6,0.7)", backdropFilter: "blur(8px)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ width: 480, background: "rgba(14,14,22,0.96)", border: "1px solid var(--border-2)", borderRadius: 18, padding: 28, boxShadow: "0 30px 100px -20px rgba(0,0,0,0.8)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 className="display" style={{ margin: 0, fontSize: 22 }}>Ajouter une clé API</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <form onSubmit={submit}>
          <Field label="NOM" value={name} onChange={e => setName(e.target.value)} placeholder="Ma clé Groq" />
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>SERVICE</div>
            <select className="input" value={service} onChange={e => setService(e.target.value)} style={{ cursor: 'pointer' }}>
              {['Groq', 'OpenAI', 'Anthropic', 'Supabase', 'GitHub', 'Autre'].map(s => <option key={s} value={s} style={{ background: '#0d0d18', color: '#e8e8f0' }}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>CLÉ API</div>
            <input className="input mono" type="password" value={keyValue} onChange={e => setKeyValue(e.target.value)} placeholder="sk-••••••••••••" required/>
          </div>
          <Field label="DESCRIPTION (OPTIONNEL)" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description…" />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim() || !keyValue.trim()}>
              {loading ? 'Enregistrement…' : 'Ajouter la clé'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tab: Account ───────────────────────────────────────────
function TabAccount({ user, updateProfile }) {
  const toast = useToast()
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDisplayName(user?.user_metadata?.display_name || '')
  }, [user?.user_metadata?.display_name])

  async function saveProfile() {
    setSaving(true)
    try {
      await updateProfile({ data: { display_name: displayName } })
      toast('Profil mis à jour', 'success')
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  async function changePassword() {
    if (newPassword.length < 6) { toast('Min. 6 caractères', 'error'); return }
    setSaving(true)
    try {
      await updateProfile({ password: newPassword })
      setNewPassword('')
      toast('Mot de passe mis à jour', 'success')
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  const initial = (user?.user_metadata?.display_name || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <section className="card card-shine">
        <SectionHeader title="Profil" inset/>
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: 16, border: "1px solid var(--border-0)", borderRadius: 12, background: "var(--surface-0)" }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", display: "grid", placeItems: "center", fontFamily: "Syne", fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
              {initial}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{displayName || user?.email?.split('@')[0]}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{user?.email}</div>
            </div>
          </div>
          <Field
            label="NOM D'AFFICHAGE"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Votre nom"
          />
          <Field
            label="EMAIL"
            value={user?.email || ''}
            readOnly
            right={<span className="pill pill-accent" style={{ height: 18, fontSize: 9.5 }}>VÉRIFIÉ</span>}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </section>

      <section className="card card-shine">
        <SectionHeader title="Sécurité" inset/>
        <div style={{ padding: "0 24px 24px" }}>
          <Field
            label="NOUVEAU MOT DE PASSE"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Min. 6 caractères"
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
            <button className="btn btn-sm" onClick={changePassword} disabled={saving || !newPassword}>
              Changer le mot de passe
            </button>
          </div>
          <div style={{ padding: "12px 0", borderTop: "1px solid var(--border-0)" }}>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>Vos clés API sont chiffrées (AES-256) dans Supabase.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)", fontSize: 12 }}>
              <Icon name="lock" size={12}/>
              <span>Chiffrement côté client avant stockage</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Tab: API Keys ──────────────────────────────────────────
function TabKeys({ userId }) {
  const { keys, loading, addKey, deleteKey } = useApiKeys(userId)
  const toast = useToast()
  const [showAdd, setShowAdd] = useState(false)

  async function handleAdd(payload) {
    try {
      await addKey(payload)
      toast('Clé ajoutée', 'success')
    } catch (err) { toast(err.message, 'error') }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette clé ?')) return
    try {
      await deleteKey(id)
      toast('Clé supprimée', 'success')
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <section className="card card-shine">
      <SectionHeader
        title="Clés API"
        sub="Stockées chiffrées (AES-256) dans Supabase"
        actions={
          <button className="btn btn-sm" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={11}/><span>Ajouter une clé</span>
          </button>
        }
      />
      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)" }}>Chargement…</div>
      ) : keys.length === 0 ? (
        <div style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ color: "var(--text-3)", fontSize: 13, marginBottom: 12 }}>Aucune clé configurée</div>
          <button className="btn btn-sm" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={11}/><span>Ajouter ma première clé</span>
          </button>
        </div>
      ) : (
        keys.map(k => <KeyRow key={k.id} k={k} onDelete={handleDelete}/>)
      )}
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 10, color: "var(--text-3)", fontSize: 12 }}>
        <Icon name="lock" size={13}/>
        <span>Vos clés ne quittent jamais votre instance Supabase. Chiffrement AES-256 côté client.</span>
      </div>
      {showAdd && <AddKeyModal onClose={() => setShowAdd(false)} onAdd={handleAdd}/>}
    </section>
  )
}

// ── Tab: Models (Moteur IA) ────────────────────────────────
function TabModels() {
  const toast = useToast()
  const [pref, setPref] = useState(() => getAIPref())
  const [apiKeyInput, setApiKeyInput] = useState(() => getAIPref().apiKey || '')

  const activeProvider = AI_PROVIDERS.find(p => p.id === pref.provider) || AI_PROVIDERS[0]
  const currentModel = activeProvider.models.some(m => m.id === pref.model)
    ? pref.model
    : activeProvider.defaultModel

  function selectProvider(providerId) {
    const p = AI_PROVIDERS.find(x => x.id === providerId)
    setPref(prev => ({ ...prev, provider: providerId, model: p?.defaultModel || '' }))
    setApiKeyInput(getAIPref().apiKey || '')
  }

  function save() {
    const updates = { provider: activeProvider.id, model: currentModel }
    if (activeProvider.requiresKey) updates.apiKey = apiKeyInput.trim()
    setAIPref(updates)
    setPref(getAIPref())
    toast('Moteur IA sauvegardé ✓', 'success')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Provider cards */}
      <section className="card card-shine">
        <SectionHeader title="Fournisseur IA" sub="Choisissez le moteur à utiliser" inset/>
        <div style={{ padding: '0 18px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {AI_PROVIDERS.map(p => {
            const isActive = activeProvider.id === p.id
            return (
              <button
                key={p.id}
                onClick={() => selectProvider(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  border: '1px solid ' + (isActive ? p.color + '55' : 'var(--border-1)'),
                  background: isActive ? p.color + '12' : 'var(--surface-0)',
                  textAlign: 'left', transition: 'all 120ms',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: p.color + '18', border: '1px solid ' + p.color + '35',
                  display: 'grid', placeItems: 'center', color: p.color,
                }}>
                  <Icon name={p.icon} size={16}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{p.label}</span>
                    {!p.requiresKey && (
                      <span className="pill pill-accent" style={{ height: 16, fontSize: 9 }}>GRATUIT</span>
                    )}
                    {isActive && <span className="dot dot-on" style={{ width: 5, height: 5, marginLeft: 'auto' }}/>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{p.sublabel}</div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Config for active provider */}
      <section className="card card-shine">
        <SectionHeader title="Configuration" sub={activeProvider.label} inset/>
        <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {activeProvider.requiresKey && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>CLÉ API</div>
              <input
                className="input mono"
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder={activeProvider.keyPlaceholder || 'Entrez votre clé API'}
                autoComplete="off"
              />
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>
                Stockée dans localStorage — jamais envoyée à Atlace.
              </div>
            </div>
          )}

          {!activeProvider.requiresKey && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid rgba(200,255,77,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--accent)' }}>
                <Icon name="zap" size={13}/>
                <span>Clé Atlace intégrée — aucune configuration requise.</span>
              </div>
            </div>
          )}

          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>MODÈLE</div>
            <select
              className="input"
              value={currentModel}
              onChange={e => setPref(prev => ({ ...prev, model: e.target.value }))}
              style={{ cursor: 'pointer' }}
            >
              {activeProvider.models.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#0d0d18', color: '#e8e8f0' }}>{m.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={save}>
              Sauvegarder
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Tab: Appearance ────────────────────────────────────────
function TabAppearance() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <section className="card card-shine">
        <SectionHeader title="Couleur d'accent" sub="Personnalisez votre interface" inset/>
        <div style={{ padding: "0 18px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { n: "Lime",   c: "#c8ff4d", active: true },
            { n: "Ion",    c: "#7dd3ff" },
            { n: "Violet", c: "#b794ff" },
            { n: "Aurore", c: "#ffb86b" },
          ].map(p => (
            <button
              key={p.n}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: 10, borderRadius: 10, cursor: "pointer",
                border: "1px solid " + (p.active ? p.c + "55" : "var(--border-0)"),
                background: p.active ? p.c + "12" : "var(--surface-0)",
              }}
              onClick={() => {
                document.documentElement.style.setProperty('--accent', p.c)
                document.documentElement.style.setProperty('--accent-ink', '#0a0d04')
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 999, background: p.c, boxShadow: "0 0 8px " + p.c + "55", flexShrink: 0 }}/>
              <span style={{ flex: 1, fontSize: 13 }}>{p.n}</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{p.c.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card card-shine">
        <SectionHeader title="Typographie" sub="Google Fonts" inset/>
        <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { role: "Display",  name: "Syne",     sample: "ATLACE", font: "Syne", weight: 800 },
            { role: "Texte",    name: "DM Sans",   sample: "Aa Bb 123", font: "DM Sans", weight: 500 },
            { role: "Mono",     name: "Fira Code", sample: "{ } => ()", font: "Fira Code", weight: 400 },
          ].map(f => (
            <div key={f.role} style={{ padding: 14, borderRadius: 10, border: "1px solid var(--border-0)", background: "var(--surface-0)" }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>{f.role}</div>
              <div style={{ fontFamily: f.font, fontWeight: f.weight, fontSize: 24, lineHeight: 1 }}>{f.sample}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 8 }}>{f.name} · {f.weight}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ── Tab: Supabase ──────────────────────────────────────────
function TabSupabase() {
  const sql = `-- ATLACE — Schéma Supabase
-- Coller dans SQL Editor > New query

create table if not exists public.api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  service     text not null default 'Other',
  key_encrypted text not null,
  description text,
  project_ids uuid[] default '{}',
  usage_count int default 0,
  created_at  timestamptz default now()
);

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  status        text not null default 'active',
  main_language text default 'JavaScript',
  external_url  text,
  api_key_ids   uuid[] default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists public.project_files (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  filename   text not null,
  language   text,
  content    text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.api_keys   enable row level security;
alter table public.projects   enable row level security;
alter table public.project_files enable row level security;

create policy "own api_keys"   on public.api_keys   for all using (user_id = auth.uid());
create policy "own projects"   on public.projects   for all using (user_id = auth.uid());
create policy "own files" on public.project_files for all
  using (project_id in (select id from public.projects where user_id = auth.uid()));`

  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="card card-shine" style={{ overflow: "hidden" }}>
      <SectionHeader
        title="Schéma Supabase"
        sub="Copiez dans le SQL editor de votre projet"
        actions={
          <button className="btn btn-sm" onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={11}/>
            <span>{copied ? "Copié !" : "Copier"}</span>
          </button>
        }
      />
      <div style={{ padding: "0 24px 24px" }}>
        <div className="editor">
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", maxHeight: 420, overflow: "auto" }}>
            <div className="gutter">
              {sql.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <pre className="code-area" style={{ margin: 0 }}>{sql}</pre>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Settings page ──────────────────────────────────────────
const TABS = [
  { id: "account",    label: "Compte",          ic: "user" },
  { id: "keys",       label: "Clés API",        ic: "key" },
  { id: "models",     label: "Moteur IA",        ic: "cpu" },
  { id: "appearance", label: "Apparence",       ic: "layers" },
  { id: "supabase",   label: "Schéma SQL",      ic: "database" },
]

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const [tab, setTab] = useState("account")

  return (
    <div style={{ padding: "32px var(--pad-x)", maxWidth: 1100, margin: "0 auto" }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>WORKSPACE · CONFIGURATION</div>
        <h1 className="display" style={{ margin: 0, fontSize: 38, lineHeight: 1.05 }}>Paramètres</h1>
        <div style={{ color: "var(--text-2)", marginTop: 8, fontSize: 14.5 }}>
          Gérez votre compte, vos clés API et la configuration d'ATLACE.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border-1)", marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "transparent", border: "none",
            padding: "12px 16px",
            color: tab === t.id ? "var(--text-1)" : "var(--text-2)",
            fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
            fontFamily: "DM Sans", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 8,
            borderBottom: "2px solid " + (tab === t.id ? "var(--accent)" : "transparent"),
            marginBottom: -1,
            transition: "color 120ms",
          }}>
            <Icon name={t.ic} size={13}/>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "account"    && <TabAccount user={user} updateProfile={updateProfile}/>}
      {tab === "keys"       && <TabKeys userId={user?.id}/>}
      {tab === "models"     && <TabModels/>}
      {tab === "appearance" && <TabAppearance/>}
      {tab === "supabase"   && <TabSupabase/>}
    </div>
  )
}
