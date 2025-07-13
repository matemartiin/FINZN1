import { defineConfig } from 'vite'

export default defineConfig({
  root: './FINZN',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: './FINZN/index.html'
    }
  },
  server: {
    port: 3000,
    host: true
  },
  base: './'
  }
})