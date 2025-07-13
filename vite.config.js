import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html'
    },
    sourcemap: true
  },
  server: {
    port: 3000,
    host: true
  },
  base: './',
  publicDir: './FINZN/public',
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})