export default function GlassInput({
  label, type = 'text', value, onChange, placeholder, error,
  className = '', required = false, textarea = false, rows = 3,
  rightElement, ...props
}) {
  const base = `
    w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
    text-white/90 placeholder-white/30 font-dm text-sm
    focus:outline-none focus:border-white/30 focus:bg-white/8
    transition-all duration-200
  `

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-syne font-bold uppercase tracking-widest text-white/50">
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {textarea ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className={`${base} resize-none`}
            {...props}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`${base} ${rightElement ? 'pr-10' : ''}`}
            {...props}
          />
        )}
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
