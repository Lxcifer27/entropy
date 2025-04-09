import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2015',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-components': ['./src/components/ui/index.js'],
          'utils': ['./src/utils/apiUtils', './src/utils/perfUtils']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    assetsInlineLimit: 4096
  },
  server: {
    open: true,
    host: true,
    port: 3000,
    hmr: {
      overlay: false
    }
  }
})
