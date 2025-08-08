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
    'process.env': {}
  },
  optimizeDeps: {
    include: ['chart.js', '@tensorflow/tfjs', '@supabase/supabase-js']
  }
})