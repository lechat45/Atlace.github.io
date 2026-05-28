import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Atlace.github.io/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['@monaco-editor/react'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          framer: ['framer-motion'],
        }
      }
    }
  }
})
