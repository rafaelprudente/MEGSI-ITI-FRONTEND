import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        headers: {
          'Host': 'files.localhost'
        }
      },
      '/auth': {
        target: 'http://localhost:30001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, '')
      },
      '/traefik-api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/traefik-api/, '/api')
      },
      '/prometheus': {
        target: 'http://localhost:9091',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/prometheus/, '')
      }
    }
  }
})
