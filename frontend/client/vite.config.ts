import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Points to our Express/Mongo backend
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
  }
})