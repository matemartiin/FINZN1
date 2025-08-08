import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    target: 'es2015',
    rollupOptions: {
      input: './index.html'
    },
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    open: false
  },
  base: './',
  publicDir: './public',
  define: {
    'process.env': {},
    global: 'globalThis'
  },
  optimizeDeps: {
    include: ['chart.js', '@supabase/supabase-js'],
    force: true
  }
})