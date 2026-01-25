import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5050',
      '/ws': {
        target: 'ws://localhost:5050',
        ws: true
      }
    }
  }
})
