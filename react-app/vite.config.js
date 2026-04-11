import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/data_json': 'http://localhost:8000',
      '/api': 'http://localhost:8000'
    }
  }
})
