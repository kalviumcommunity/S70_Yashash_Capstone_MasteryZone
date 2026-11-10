import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/auth': {
        target: 'http://localhost:5012',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5012',
        changeOrigin: true,
        secure: false,
      },
      '/recordings': {
        target: 'http://localhost:5012',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5012',
        changeOrigin: true,
        secure: false,
      },
      '/certificates': {
        target: 'http://localhost:5012',
        changeOrigin: true,
        secure: false,
      },
      '/proctoring-evidence': {
        target: 'http://localhost:5012',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5012',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['react-icons'],
          'vendor-firebase': ['firebase/app', 'firebase/auth'],
        }
      }
    }
  }
})
