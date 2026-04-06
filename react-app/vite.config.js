import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/Data': 'http://localhost:8000',
      '/Graphics': 'http://localhost:8000',
      '/data_json': 'http://localhost:8000',
      '/api': 'http://localhost:8000'
    }
  }
})
