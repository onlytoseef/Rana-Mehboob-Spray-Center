import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true,        // <-- Yeh lazmi add karein
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: true,        // <-- Yeh bhi lazmi add karein
    port: 5173,        // <-- Ise 5173 kar dein taake Coolify ki settings se match kare
    strictPort: true
  }
})
