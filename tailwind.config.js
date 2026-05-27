/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        fira: ['Fira Code', 'monospace'],
      },
      colors: {
        'bg-deep': '#050508',
        'glass-border': 'rgba(255,255,255,0.10)',
        'glass-shine': 'rgba(255,255,255,0.06)',
        'accent-white': '#ffffff',
        'text-primary': '#f0f0f0',
        'text-secondary': '#888899',
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'orbit': 'orbit 8s linear infinite',
        'orb-1': 'orb1 60s linear infinite',
        'orb-2': 'orb2 60s linear infinite',
        'pulse-dot': 'pulseDot 2.5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s ease forwards',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotateX(70deg) rotateZ(0deg)' },
          '100%': { transform: 'rotateX(70deg) rotateZ(360deg)' },
        },
        orb1: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(5%, 10%)' },
          '50%': { transform: 'translate(10%, 5%)' },
          '75%': { transform: 'translate(5%, -5%)' },
        },
        orb2: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(-5%, -10%)' },
          '50%': { transform: 'translate(-10%, -5%)' },
          '75%': { transform: 'translate(-5%, 5%)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
