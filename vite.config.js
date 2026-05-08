import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Railway / hosts compartidos: PORT viene del env, escuchar 0.0.0.0
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
    allowedHosts: true,
  },
})
