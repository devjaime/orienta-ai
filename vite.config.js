import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    watch: {
      ignored: [
        '**/.agents/**',
        '**/.codex/**',
        '**/skills/**',
        '**/backend/**',
        '**/frontend/**',
        '**/data/**',
        '**/app_vocacional_docs/**',
        '**/node_modules 2/**'
      ]
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  },
  build: {
    // Optimizaciones para producción
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Code splitting optimizado
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-charts': ['recharts']
        }
      }
    },
    // Generar sourcemap para debugging
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  // Optimizaciones de resolve
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
