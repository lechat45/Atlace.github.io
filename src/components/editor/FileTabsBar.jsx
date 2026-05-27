import Icon from '../icons/Icon'

const LANG_DOT = {
  html: '#f97316',
  css: '#60a5fa',
  javascript: '#facc15',
  python: '#4ade80',
  typescript: '#818cf8',
  default: 'var(--text-3)',
}

export default function FileTabsBar({ files, activeFileId, onSelect, onClose, onNewFile }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2, padding: '8px 12px 0',
      overflowX: 'auto', borderBottom: '1px solid var(--border-0)',
      background: 'rgba(255,255,255,0.01)', scrollbarWidth: 'none', flexShrink: 0,
    }}>
      {files.map(file => {
        const isActive = file.id === activeFileId
        const dot = LANG_DOT[file.language] || LANG_DOT.default
        return (
          <div
            key={file.id}
            onClick={() => onSelect(file)}
            className={isActive ? 'tab tab-active' : 'tab'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }}/>
            <span className="mono" style={{ fontSize: 11.5 }}>{file.filename}</span>
            {onClose && (
              <button
                onClick={e => { e.stopPropagation(); onClose(file) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', display: 'flex', padding: 0,
                  opacity: isActive ? 1 : 0, transition: 'opacity 120ms',
                }}
                className="btn-icon"
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.opacity = 0 }}
              >
                <Icon name="x" size={10}/>
              </button>
            )}
          </div>
        )
      })}
      <button
        onClick={onNewFile}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', fontSize: 11.5, color: 'var(--text-3)',
          background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
          transition: 'color 120ms',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <Icon name="plus" size={12}/> Nouveau
      </button>
    </div>
  )
}
