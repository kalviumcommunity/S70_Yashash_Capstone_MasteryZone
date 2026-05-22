import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:5012',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5012',
        changeOrigin: true,
      }
    }
  }
})
