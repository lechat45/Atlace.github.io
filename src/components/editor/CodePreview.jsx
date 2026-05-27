import { useState, useRef, useEffect } from 'react'
import Icon from '../icons/Icon'

// ── Node.js polyfill HTML injected into the sandboxed iframe ──────────────
function buildNodeHtml(code) {
  // JSON.stringify escapes backticks, </script>, backslashes — safe injection
  const safeCode = JSON.stringify(code)

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>
(function(){
const _p=(t,m)=>window.parent.postMessage({type:t,msg:String(m)},'*');

// ── console ──
window.console={
  log:(...a)=>_p('log',a.map(x=>{try{return typeof x==='object'?JSON.stringify(x,null,2):String(x)}catch(e){return String(x)}}).join(' ')),
  error:(...a)=>_p('error',a.map(x=>x instanceof Error?(x.stack||x.message):String(x)).join(' ')),
  warn:(...a)=>_p('warn',a.map(String).join(' ')),
  info:(...a)=>_p('info',a.map(String).join(' ')),
  table:d=>_p('log',typeof d==='object'?JSON.stringify(d,null,2):String(d)),
  dir:d=>_p('log',typeof d==='object'?JSON.stringify(d,null,2):String(d)),
  time:l=>{window.__timers=window.__timers||{};window.__timers[l]=Date.now()},
  timeEnd:l=>{const s=window.__timers&&window.__timers[l];_p('log',(l||'default')+': '+(s?Date.now()-s:0)+'ms')},
  group:l=>_p('log','▶ '+(l||'')),
  groupEnd:()=>{},
  assert:(c,...a)=>{if(!c)_p('error','Assertion failed: '+a.map(String).join(' '))},
  clear:()=>{},
};

// ── process ──
const process={
  env:{NODE_ENV:'development',PATH:'/usr/bin'},
  argv:['node','script.js'],
  version:'v20.11.0',
  versions:{node:'20.11.0'},
  platform:'linux',
  arch:'x64',
  pid:1,
  exit:c=>_p('info','⬛ process.exit('+(c||0)+')'),
  cwd:()=>'/',
  chdir:()=>{},
  hrtime:()=>[0,0],
  memoryUsage:()=>({rss:0,heapTotal:0,heapUsed:0,external:0}),
  nextTick:fn=>Promise.resolve().then(fn),
  stdout:{write:s=>_p('log',s),isTTY:false},
  stderr:{write:s=>_p('error',s),isTTY:false},
};
window.process=process;

// ── Buffer ──
class Buffer extends Uint8Array{
  static from(d,enc){
    if(typeof d==='string'){
      const b=new Buffer(d.length);
      for(let i=0;i<d.length;i++)b[i]=d.charCodeAt(i);
      return b;
    }
    return new Buffer(d);
  }
  static alloc(n,fill=0){const b=new Buffer(n);b.fill(fill);return b;}
  static isBuffer(v){return v instanceof Buffer;}
  toString(enc='utf8'){return Array.from(this).map(c=>String.fromCharCode(c)).join('');}
}
window.Buffer=Buffer;

// ── path ──
const _path={
  sep:'/',posix:{sep:'/'},win32:{sep:'\\\\'},
  join:(...p)=>p.join('/').replace(/\\/+/g,'/').replace(/^\\/+/,''),
  resolve:(...p)=>('/'+p.join('/')).replace(/\\/+/g,'/'),
  basename:(p,e)=>{const b=String(p).split(/[\\\\/]/).pop();return e&&b.endsWith(e)?b.slice(0,-e.length):b;},
  dirname:p=>{const parts=String(p).split(/[\\\\/]/);parts.pop();return parts.join('/')||'/';},
  extname:p=>{const m=String(p).match(/\\.[^.\\\\/]+$/);return m?m[0]:'';},
  parse:p=>{const ext=String(p).match(/\\.[^.\\\\/]+$/);const base=String(p).split(/[\\\\/]/).pop();return{root:'/',dir:String(p).split(/[\\\\/]/).slice(0,-1).join('/'),base,ext:ext?ext[0]:'',name:base.replace(ext?ext[0]:'','')};},
  format:o=>(o.dir?o.dir+'/':'')+(o.base||o.name+(o.ext||'')),
  isAbsolute:p=>String(p).startsWith('/'),
  relative:(f,t)=>t,
  normalize:p=>String(p).replace(/\\/+/g,'/'),
};

// ── os ──
const _os={
  platform:()=>'linux',type:()=>'Linux',arch:()=>'x64',
  homedir:()=>'/home/user',tmpdir:()=>'/tmp',hostname:()=>'atlace-sandbox',
  cpus:()=>[{model:'Browser CPU',speed:2400,times:{user:0,nice:0,sys:0,idle:0,irq:0}}],
  totalmem:()=>8*1024*1024*1024,freemem:()=>4*1024*1024*1024,
  uptime:()=>0,networkInterfaces:()=>({}),EOL:'\\n',
};

// ── util ──
const _util={
  inspect:(o,opts)=>{try{return JSON.stringify(o,null,2);}catch(e){return String(o);}},
  format:(...a)=>a.map(String).join(' '),
  promisify:fn=>(...args)=>new Promise((res,rej)=>fn(...args,(e,r)=>e?rej(e):res(r))),
  isString:v=>typeof v==='string',isNumber:v=>typeof v==='number',isArray:Array.isArray,
  deprecate:(fn,msg)=>{_p('warn','[deprecated] '+msg);return fn;},
  types:{isPromise:v=>v&&typeof v.then==='function'},
};

// ── events ──
class EventEmitter{
  constructor(){this._e={};}
  on(ev,fn){(this._e[ev]=this._e[ev]||[]).push(fn);return this;}
  once(ev,fn){const w=(...a)=>{fn(...a);this.off(ev,w)};this.on(ev,w);return this;}
  off(ev,fn){if(this._e[ev])this._e[ev]=this._e[ev].filter(f=>f!==fn);return this;}
  emit(ev,...a){(this._e[ev]||[]).forEach(f=>f(...a));return !!(this._e[ev]&&this._e[ev].length);}
  removeAllListeners(ev){if(ev)delete this._e[ev];else this._e={};return this;}
  listenerCount(ev){return(this._e[ev]||[]).length;}
}

// ── crypto ──
const _crypto={
  randomUUID:()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16);}),
  randomBytes:n=>{const b=new Uint8Array(n);crypto.getRandomValues(b);return{toString:(enc)=>Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join('')};},
  createHash:()=>{let d='';return{update:s=>{d+=s;return this;},digest:(enc)=>'[hash:'+d.length+']'};},
  createHmac:()=>{return{update:()=>({digest:()=>'[hmac]'})};},
};

// ── assert ──
const _assert=(v,msg)=>{if(!v)throw new Object.assign(new Error(msg||'Assertion failed'),{name:'AssertionError'});};
Object.assign(_assert,{
  ok:(v,m)=>_assert(v,m),
  equal:(a,b,m)=>{if(a!=b)throw new Error(m||a+' == '+b+' failed');},
  strictEqual:(a,b,m)=>{if(a!==b)throw new Error(m||a+' === '+b+' failed');},
  notEqual:(a,b,m)=>{if(a==b)throw new Error(m||a+' != '+b+' failed');},
  deepEqual:(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(m||'deepEqual failed');},
  throws:(fn,m)=>{try{fn();throw new Error(m||'Expected to throw')}catch(e){if(e.message===m)throw e;}},
  rejects:async(fn,m)=>{try{await fn();throw new Error(m||'Expected to reject')}catch(e){if(e.message===m)throw e;}},
});

// ── readline (stub) ──
const _readline={
  createInterface:opts=>({
    question:(q,cb)=>{_p('info','[readline] '+q);cb('');},
    close:()=>{},on:()=>{},
  }),
};

// ── require ──
const _mods={
  path:_path,'node:path':_path,
  os:_os,'node:os':_os,
  util:_util,'node:util':_util,
  events:{EventEmitter},'node:events':{EventEmitter},
  crypto:_crypto,'node:crypto':_crypto,
  assert:_assert,'node:assert':_assert,
  readline:_readline,'node:readline':_readline,
  buffer:{Buffer},'node:buffer':{Buffer},
  stream:{Readable:EventEmitter,Writable:EventEmitter,Transform:EventEmitter},
  timers:{setTimeout,setInterval,clearTimeout,clearInterval,setImmediate:fn=>setTimeout(fn,0)},
  fs:{
    readFileSync:()=>{throw new Error('fs.readFileSync non disponible (navigateur — utilisez Importer pour charger des fichiers)');},
    writeFileSync:(p,d)=>_p('log','[fs] writeFileSync("'+p+'", '+String(d).length+' bytes)'),
    appendFileSync:(p,d)=>_p('log','[fs] appendFileSync("'+p+'", '+String(d).length+' bytes)'),
    existsSync:()=>false,mkdirSync:()=>{},readdirSync:()=>[],statSync:()=>{throw new Error('fs.statSync non disponible');},
    promises:{
      readFile:()=>Promise.reject(new Error('fs non disponible')),
      writeFile:(p,d)=>{_p('log','[fs] writeFile("'+p+'")');return Promise.resolve();},
      mkdir:()=>Promise.resolve(),readdir:()=>Promise.resolve([]),
    },
  },
  'fs/promises':{readFile:()=>Promise.reject(new Error('fs non disponible')),writeFile:()=>Promise.resolve()},
  http:{createServer:()=>({listen:(p,h,cb)=>{_p('info','[http] Serveur simulé sur le port '+p);if(cb)cb();}})},
  https:{createServer:()=>({listen:(p,h,cb)=>{_p('info','[https] Serveur simulé');if(cb)cb();}}),request:()=>({on:()=>{},end:()=>{}})},
  net:{createServer:()=>({listen:()=>{},on:()=>{}})},
  child_process:{exec:(cmd,cb)=>{_p('warn','[child_process] exec("'+cmd+'") non disponible');if(cb)cb(null,'','');},execSync:cmd=>{_p('warn','[child_process] execSync("'+cmd+'") non disponible');return '';}},
  url:{URL,URLSearchParams,parse:u=>{try{const x=new URL(u);return{href:x.href,host:x.host,pathname:x.pathname,search:x.search};}catch(e){return{};}},format:o=>String(o)},
};
window.require=m=>{
  if(_mods[m])return _mods[m];
  // relative require stub
  if(m.startsWith('.')){_p('warn','⚠ require("'+m+'") — modules locaux non disponibles');return {};}
  _p('warn','⚠ require("'+m+'") non disponible dans le navigateur');
  return {};
};

// ── globals ──
const __dirname='/';const __filename='/script.js';
const module={exports:{},require:window.require,id:'.',loaded:true};
const exports=module.exports;
window.global=window;window.globalThis=window;

// ── error handlers ──
window.onerror=(msg,s,l,c,err)=>{_p('error',err?(err.stack||err.message):msg);};
window.onunhandledrejection=e=>{_p('error','UnhandledPromiseRejection: '+(e.reason?.stack||e.reason?.message||String(e.reason)));};

// ── run ──
;(async()=>{
  try{
    await eval(${safeCode});
  }catch(e){
    _p('error',e.stack||e.message||String(e));
  }
})().then(()=>setTimeout(()=>_p('done',''),50)).catch(e=>_p('error',e.stack||e.message));
})();
<\/script></body></html>`
}

// ── Component ─────────────────────────────────────────────
export default function CodePreview({ files, language, onAIFix }) {
  const [output, setOutput] = useState([])
  const [running, setRunning] = useState(false)
  const iframeRef = useRef(null)
  const outputRef = useRef(null)
  const runningRef = useRef(false)
  const lastDocRef = useRef(null) // stores the last clean HTML build for new-tab preview

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [output])

  function log(msg, type = 'log') {
    setOutput(prev => [...prev, { msg: String(msg), type, ts: Date.now() + Math.random() }])
  }

  // Detect mode from language prop first, then fall back to inspecting the actual files
  const hasHtmlFile = files.some(f => /\.(html|htm)$/.test(f.filename))
  const hasPyFile   = files.some(f => /\.py$/.test(f.filename))
  const hasJsFile   = files.some(f => /\.(js|mjs|cjs|ts|jsx|tsx)$/.test(f.filename))

  const isHtml   = ['HTML/JS/CSS', 'React', 'Vue'].includes(language)   || (!hasPyFile && !hasJsFile && hasHtmlFile) || (hasHtmlFile && !['Node.js','JavaScript','TypeScript','Python'].includes(language))
  const isPython = language === 'Python'                                  || (hasPyFile  && !['HTML/JS/CSS','React','Vue','Node.js','JavaScript','TypeScript'].includes(language))
  const isNode   = ['Node.js', 'JavaScript', 'TypeScript'].includes(language) || (!hasHtmlFile && !hasPyFile && hasJsFile && !['HTML/JS/CSS','React','Vue','Python'].includes(language))

  async function run() {
    setOutput([])
    runningRef.current = true
    setRunning(true)
    if (isPython) await runPython()
    else if (isHtml) runHtml()
    else if (isNode) runNodeJs()
    else { log('Langage non supporté pour l\'exécution', 'info'); setRunning(false) }
  }

  // Escape a filename for use inside a RegExp
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

  // Inline local CSS/JS files referenced in an HTML document string
  function inlineAssets(doc) {
    files.filter(f => /\.css$/.test(f.filename)).forEach(({ filename, content }) => {
      const re = new RegExp(`<link\\b[^>]*href=["'][./]*${reEsc(filename)}["'][^>]*/?>`, 'gi')
      if (re.test(doc)) {
        doc = doc.replace(re, `<style>\n${content}\n</style>`)
      } else {
        // CSS not referenced explicitly — inject before </head>
        doc = doc.replace(/(<\/head>)/i, `<style>\n${content}\n</style>\n$1`)
      }
    })
    files.filter(f => /\.js$/.test(f.filename)).forEach(({ filename, content }) => {
      const re = new RegExp(`<script\\b[^>]*src=["'][./]*${reEsc(filename)}["'][^>]*>\\s*<\\/script>`, 'gi')
      if (re.test(doc)) {
        doc = doc.replace(re, `<script>\n${content}\n<\/script>`)
      }
    })
    return doc
  }

  function runHtml() {
    const htmlFile = files.find(f => /\.html?$/.test(f.filename))
    if (!htmlFile) { log('Aucun fichier .html trouvé', 'info'); setRunning(false); return }

    // ── sandbox polyfills injected into the iframe ──────────────────
    const interceptor = `<script>(function(){
  function mkStore(){var s={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(s,k)?s[k]:null;},setItem:function(k,v){s[String(k)]=String(v);},removeItem:function(k){delete s[k];},clear:function(){s={};},key:function(i){return Object.keys(s)[i]||null;},get length(){return Object.keys(s).length;}}}
  try{Object.defineProperty(window,'localStorage',{get:mkStore,configurable:true})}catch(e){}
  try{Object.defineProperty(window,'sessionStorage',{get:mkStore,configurable:true})}catch(e){}
  var _ck='';try{Object.defineProperty(document,'cookie',{get:function(){return _ck;},set:function(v){_ck+=(_ck?'; ':'')+v;},configurable:true});}catch(e){}
  if(!window.Notification){window.Notification=function(t){console.log('[Notif] '+t);};window.Notification.permission='denied';window.Notification.requestPermission=function(){return Promise.resolve('denied');};}
  try{Object.defineProperty(navigator,'serviceWorker',{get:function(){return{register:function(u){console.warn('[SW] Service Worker ignoré dans le sandbox: '+u);return Promise.resolve({scope:'/',installing:null,waiting:null,active:null,addEventListener:function(){},removeEventListener:function(){}});},ready:Promise.resolve({scope:'/',installing:null,waiting:null,active:null}),controller:null,addEventListener:function(){},removeEventListener:function(){},getRegistration:function(){return Promise.resolve(undefined);},getRegistrations:function(){return Promise.resolve([]);},oncontrollerchange:null};},configurable:true});}catch(e){}
  var _o={};['log','warn','error','info'].forEach(function(m){_o[m]=console[m].bind(console);console[m]=function(){var a=Array.prototype.slice.call(arguments);_o[m].apply(console,a);window.parent.postMessage({type:m==='error'?'error':m==='warn'?'warn':'log',msg:a.map(function(x){try{return typeof x==='object'?JSON.stringify(x,null,2):String(x);}catch(e){return String(x);}}).join(' ')},'*');}});
  window.onerror=function(msg,s,l,c,err){window.parent.postMessage({type:'error',msg:err?(err.stack||err.message):msg},'*');};
  window.onunhandledrejection=function(e){window.parent.postMessage({type:'error',msg:'Promise rejetée: '+(e.reason&&(e.reason.stack||e.reason.message)||String(e.reason||e))},'*');};
})()</script>`

    // Use the user's full HTML as-is, inline local assets, inject interceptor
    let doc = inlineAssets(htmlFile.content)

    // Inject interceptor right after <meta charset> (preserves original charset + encoding)
    const csm = doc.match(/<meta\s[^>]*charset[^>]*>/i)
    if (csm) {
      const i = doc.indexOf(csm[0]) + csm[0].length
      doc = doc.slice(0, i) + '\n' + interceptor + doc.slice(i)
    } else if (/<head/i.test(doc)) {
      doc = doc.replace(/(<head[^>]*>)/i, `$1\n<meta charset="UTF-8">\n${interceptor}`)
    } else {
      doc = interceptor + doc
    }

    // Store a clean (no-interceptor) version for new-tab opening
    lastDocRef.current = inlineAssets(htmlFile.content)

    if (iframeRef.current) iframeRef.current.srcdoc = doc
    log('✓ Rendu HTML chargé', 'success')
    setRunning(false)
  }

  function runNodeJs() {
    const jsFiles = files.filter(f => /\.(js|mjs|cjs|ts|jsx|tsx)$/.test(f.filename))
    if (!jsFiles.length) {
      log('Aucun fichier .js trouvé', 'info')
      setRunning(false)
      return
    }
    // Combine all JS files in order
    const code = jsFiles.map(f => `// ── ${f.filename} ──\n${f.content}`).join('\n\n')
    log(`▶ Exécution de ${jsFiles.length > 1 ? jsFiles.length + ' fichiers' : '"' + jsFiles[0].filename + '"'}…`, 'info')
    if (iframeRef.current) iframeRef.current.srcdoc = buildNodeHtml(code)
    // Timeout fallback if 'done' never arrives (e.g. infinite loop guard)
    setTimeout(() => { if (runningRef.current) { setRunning(false); runningRef.current = false } }, 8000)
  }

  async function runPython() {
    log('Chargement de Pyodide...', 'info')
    try {
      if (!window.pyodide) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js'
        document.head.appendChild(script)
        await new Promise((res, rej) => { script.onload = res; script.onerror = rej })
        window.pyodide = await window.loadPyodide({ stdout: msg => log(msg), stderr: msg => log(msg, 'error') })
        log('✓ Pyodide prêt', 'success')
      }
      const pyCode = files.filter(f => f.filename.endsWith('.py')).map(f => f.content).join('\n\n')
      if (!pyCode.trim()) { log('Aucun fichier .py trouvé', 'info'); setRunning(false); return }
      log('▶ Exécution Python...', 'info')
      await window.pyodide.runPythonAsync(pyCode)
      log('✓ Terminé', 'success')
    } catch (err) { log(err.message || String(err), 'error') }
    setRunning(false)
    runningRef.current = false
  }

  function clear() {
    setOutput([])
    if (iframeRef.current) iframeRef.current.srcdoc = ''
  }

  function openInNewTab() {
    const htmlFile = files.find(f => /\.html?$/.test(f.filename))
    // Clean doc = user's HTML with inlined assets, no sandbox interceptor
    const doc = lastDocRef.current
      || (htmlFile ? inlineAssets(htmlFile.content) : null)
      || (() => {
           const css = files.filter(f => /\.css$/.test(f.filename)).map(f => f.content).join('\n')
           const js  = files.filter(f => /\.js$/.test(f.filename)).map(f => f.content).join('\n')
           const html = htmlFile?.content || ''
           return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`
         })()

    // TextEncoder guarantees correct UTF-8 — fixes emoji mojibake
    const bytes = new TextEncoder().encode(doc)
    const blob  = new Blob([bytes], { type: 'text/html;charset=utf-8' })
    const url   = URL.createObjectURL(blob)
    const tab   = window.open(url, '_blank')
    if (tab) tab.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }

  useEffect(() => {
    function onMessage(e) {
      if (!e.data?.type) return
      const { type, msg } = e.data
      if (type === 'log') log(msg, 'log')
      else if (type === 'error') log(msg, 'error')
      else if (type === 'warn') log(msg, 'warn')
      else if (type === 'info') log(msg, 'info')
      else if (type === 'done') { setRunning(false); runningRef.current = false }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const logColor = t => {
    if (t === 'error') return 'var(--danger)'
    if (t === 'success') return 'var(--accent)'
    if (t === 'warn') return '#f59e0b'
    if (t === 'info') return '#60a5fa'
    return 'var(--text-2)'
  }

  const logPrefix = t => {
    if (t === 'error') return '✗ '
    if (t === 'success') return '✓ '
    if (t === 'warn') return '⚠ '
    if (t === 'info') return 'ℹ '
    return '› '
  }

  const modeLabel = isHtml ? 'RENDU' : isPython ? 'PYTHON' : 'NODE.JS'
  const modeIcon = isHtml ? 'globe' : isPython ? 'zap' : 'terminal'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-deep)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 14px', borderBottom: '1px solid var(--border-0)',
        background: 'rgba(255,255,255,0.015)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name={modeIcon} size={11} style={{ color: isNode ? 'var(--accent)' : 'var(--text-3)' }}/>
          <span className="eyebrow" style={{ fontSize: 9.5 }}>{modeLabel}</span>
          {isNode && (
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 99, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(200,255,77,0.25)' }}>
              simulé
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="btn btn-ghost btn-sm" onClick={clear} style={{ gap: 4, fontSize: 11 }}>
            <Icon name="refresh" size={10}/> Reset
          </button>
          {isHtml && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={openInNewTab}
              title="Ouvrir dans un nouvel onglet"
              style={{ gap: 4, fontSize: 11 }}
            >
              <Icon name="external" size={10}/> Ouvrir
            </button>
          )}
          <button
            className="btn btn-sm"
            onClick={run}
            disabled={running}
            style={{ background: running ? 'var(--surface-1)' : 'var(--accent-soft)', color: running ? 'var(--text-3)' : 'var(--accent)', borderColor: running ? 'var(--border-1)' : 'rgba(200,255,77,0.3)', gap: 4, fontSize: 11 }}
          >
            {running
              ? <><div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }}/> En cours…</>
              : <><Icon name="play" size={10}/> Lancer</>
            }
          </button>
        </div>
      </div>

      {/* All iframes hidden — HTML runs in iframe for console capture, preview via Ouvrir */}
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts allow-modals"
        style={{ display: 'none' }}
        title="runner"
      />

      {/* Console output — full height for all modes */}
      <div
        ref={outputRef}
        style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}
      >
        {output.length === 0 && !running && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--text-4)' }}>
            <Icon name="terminal" size={22}/>
            <span style={{ fontSize: 12 }}>Cliquez sur <strong style={{ color: 'var(--text-3)' }}>Lancer</strong> pour exécuter</span>
            {isHtml && (
              <button className="btn btn-ghost btn-sm" onClick={openInNewTab} style={{ marginTop: 4, fontSize: 11, gap: 5 }}>
                <Icon name="external" size={11}/> Aperçu dans un nouvel onglet
              </button>
            )}
          </div>
        )}
        {output.map(({ msg, type, ts }) => (
          <div key={ts} style={{ display: 'flex', gap: 0, marginBottom: 1 }}>
            <pre className="mono" style={{
              margin: 0, fontSize: 11.5, color: logColor(type), lineHeight: 1.75,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              <span style={{ opacity: 0.5, userSelect: 'none' }}>{logPrefix(type)}</span>{msg}
            </pre>
          </div>
        ))}

        {/* ── Bouton "Corriger avec IA" quand il y a des erreurs ── */}
        {onAIFix && output.some(o => o.type === 'error') && !running && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-0)' }}>
            <button
              className="btn btn-sm"
              onClick={() => {
                const errors = output.filter(o => o.type === 'error').map(o => o.msg).join('\n')
                onAIFix(errors)
              }}
              style={{
                width: '100%', justifyContent: 'center',
                background: 'rgba(255,107,107,0.08)', color: '#ff9999',
                border: '1px solid rgba(255,107,107,0.25)', gap: 6,
              }}
            >
              <Icon name="wrench" size={12}/> Corriger ces erreurs avec l'IA
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
