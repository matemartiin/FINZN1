import { defineConfig } from 'vite'

export default defineConfig({
  root: './FINZN',
  build: {
    outDir: '../dist'
  },
  server: {
    port: 3000
  }
})