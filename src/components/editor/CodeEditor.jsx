import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import Icon from '../icons/Icon'

const LANG_MAP = {
  html: 'html', css: 'css', javascript: 'javascript',
  python: 'python', js: 'javascript', ts: 'typescript',
  json: 'json', md: 'markdown', txt: 'plaintext',
}

function getLang(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase()
  return LANG_MAP[ext] || 'plaintext'
}

export default function CodeEditor({ file, onChange }) {
  const editorRef = useRef(null)

  function handleMount(editor) {
    editorRef.current = editor
  }

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) window.monaco?.editor?.setModelLanguage(model, getLang(file?.filename))
    }
  }, [file?.filename])

  if (!file) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, color: 'var(--text-4)',
        background: 'var(--bg-deep)',
      }}>
        <Icon name="fileCode" size={28}/>
        <span style={{ fontSize: 13 }}>Sélectionnez ou créez un fichier</span>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', background: '#0d0d14' }}>
      <Editor
        height="100%"
        language={getLang(file.filename)}
        value={file.content || ''}
        onChange={onChange}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        }}
      />
    </div>
  )
}
