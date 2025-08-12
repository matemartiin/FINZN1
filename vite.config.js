import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html'
    },
    sourcemap: mode === 'development'
  },
  server: {
    port: 3000,
    host: true
  },
  base: './',
  publicDir: './public',
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}))