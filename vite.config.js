import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html'
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2015'
  },
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    open: false
  },
  base: './',
  publicDir: './public',
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis'
  },
  optimizeDeps: {
    include: ['chart.js', '@tensorflow/tfjs', '@supabase/supabase-js'],
    exclude: ['@google/genai']
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['chart.js'],
          ai: ['@tensorflow/tfjs', '@google/genai'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})