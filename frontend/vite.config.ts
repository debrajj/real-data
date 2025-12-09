import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@views': path.resolve(__dirname, './views'),
      '@client': path.resolve(__dirname, './client'),
      '@app': path.resolve(__dirname, './shopify'),
    },
  },
  
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/webhooks': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  define: {
    'process.env.SHOPIFY_API_KEY': JSON.stringify(process.env.SHOPIFY_API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
