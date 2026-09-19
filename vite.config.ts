import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Agar dev server chal raha ho to uske liye:
    allowedHosts: ['.mesmachinery.com'], 
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    // Kyunke error mein preview server ka zikr hai, yeh block sab se zaroori hai:
    allowedHosts: ['.mesmachinery.com'] 
  }
})
