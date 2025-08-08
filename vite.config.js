import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000
  },
  optimizeDeps: {
    force: true
  }
})