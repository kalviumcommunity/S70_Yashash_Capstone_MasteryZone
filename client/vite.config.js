import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:5012',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:5012',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5012',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  build: {
    cssCodeSplit: false
  }
})
