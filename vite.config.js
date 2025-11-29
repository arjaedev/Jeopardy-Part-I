import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/Jeopardy-Part-I/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        round1: resolve(__dirname, 'round-1.html'),
        round2: resolve(__dirname, 'round-2.html'),
        final: resolve(__dirname, 'final-jeopardy.html'),
      },
    },
  },
})
