import { motion } from 'framer-motion'

export default function AnimatedGlobe({ size = 200 }) {
  const r = size / 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Sphere base */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 0 60px rgba(139,92,246,0.15), inset 0 0 40px rgba(0,0,0,0.6)',
        }}
      />

      {/* SVG grid lines */}
      <svg
        className="absolute inset-0"
        viewBox={`0 0 ${size} ${size}`}
        style={{ borderRadius: '50%', overflow: 'hidden' }}
      >
        <defs>
          <clipPath id="globeClip">
            <circle cx={r} cy={r} r={r - 1} />
          </clipPath>
        </defs>
        <g clipPath="url(#globeClip)" opacity="0.25">
          {/* Latitude lines */}
          {[-60,-40,-20,0,20,40,60].map(lat => {
            const y = r + (lat / 90) * r
            const rx = Math.sqrt(Math.max(0, r * r - (y - r) * (y - r)))
            return rx > 2 ? (
              <ellipse key={lat} cx={r} cy={y} rx={rx} ry={Math.abs(lat) < 10 ? 1 : 0.5}
                stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" fill="none" />
            ) : null
          })}
          {/* Longitude lines */}
          {[0,30,60,90,120,150].map(lng => (
            <ellipse key={lng} cx={r} cy={r} rx={r - 1} ry={(r - 1) * Math.abs(Math.cos(lng * Math.PI / 180))}
              stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" fill="none"
              transform={`rotate(${lng}, ${r}, ${r})`} />
          ))}
        </g>
      </svg>

      {/* Orbital ring */}
      <div
        className="absolute inset-0"
        style={{
          perspective: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          animate={{ rotateZ: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            width: size * 1.35,
            height: size * 1.35,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.20)',
            borderTopColor: 'rgba(255,255,255,0.6)',
            transform: 'rotateX(70deg)',
            position: 'relative',
          }}
        >
          {/* Orbital dot */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 0 12px rgba(255,255,255,0.8)',
            }}
          />
        </motion.div>
      </div>

      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.1) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
    </div>
  )
}
