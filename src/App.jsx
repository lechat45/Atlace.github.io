import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/ui/Toast'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import CommandPalette from './components/layout/CommandPalette'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import AIStudio from './pages/AIStudio'
import Settings from './pages/Settings'

// Pages that need full-height layout (no outer scroll)
const FULLBLEED_PATHS = ['/chat', '/projects']

function ProtectedShell({ children }) {
  const { user, loading } = useAuth()
  const [palette, setPalette] = useState(false)

  // ⌘K shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette(p => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-deep)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }}/>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <ShellLayout palette={palette} onPalette={setPalette}>
      {children}
    </ShellLayout>
  )
}

// Separate component so useLocation works (inside Router)
function ShellLayout({ children, palette, onPalette }) {
  const { pathname } = useLocation()
  const isFullbleed = FULLBLEED_PATHS.some(p => pathname.endsWith(p) || pathname.includes(p + '/'))

  return (
    <>
      <div className="app-bg"/>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="orb orb-1" style={{ width: 600, height: 600, top: '-20%', left: '-10%', opacity: 0.4 }}/>
        <div className="orb orb-2" style={{ width: 500, height: 500, bottom: '-25%', right: '-12%', opacity: 0.3 }}/>
      </div>
      <div className="noise"/>

      <div style={{ position: 'relative', zIndex: 2, height: '100vh', display: 'flex' }}>
        <Sidebar/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar onPalette={() => onPalette(true)}/>
          <main style={{ flex: 1, minHeight: 0, overflow: isFullbleed ? 'hidden' : 'auto' }}>
            {children}
          </main>
        </div>
      </div>

      <CommandPalette open={palette} onClose={() => onPalette(false)}/>
    </>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  // Apply design tokens on mount
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent', '#c8ff4d')
    root.style.setProperty('--accent-ink', '#0a0d04')
    root.style.setProperty('--accent-glow', 'rgba(200, 255, 77, 0.35)')
    root.style.setProperty('--accent-soft', 'rgba(200, 255, 77, 0.14)')
    root.dataset.density = 'comfortable'
    root.dataset.glass = 'default'
    root.dataset.animations = 'on'
  }, [])

  return (
    <ToastProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/" element={<Landing/>}/>
          <Route path="/login"    element={<PublicRoute><Login/></PublicRoute>}/>
          <Route path="/register" element={<PublicRoute><Register/></PublicRoute>}/>

          <Route path="/dashboard" element={<ProtectedShell><Dashboard/></ProtectedShell>}/>
          <Route path="/projects"  element={<ProtectedShell><Projects/></ProtectedShell>}/>
          <Route path="/projects/:id" element={<ProtectedShell><ProjectDetail/></ProtectedShell>}/>
          <Route path="/chat"     element={<ProtectedShell><AIStudio/></ProtectedShell>}/>
          <Route path="/ai-studio" element={<Navigate to="/chat" replace/>}/>
          <Route path="/settings" element={<ProtectedShell><Settings/></ProtectedShell>}/>
          <Route path="/apikeys"  element={<Navigate to="/settings" replace/>}/>

          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
