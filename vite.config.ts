import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // Phaser and Monaco are their own chunks and load in parallel.
        manualChunks(id: string) {
          if (id.includes('node_modules/phaser')) return 'phaser'
          if (id.includes('node_modules/monaco-editor')) return 'monaco'
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
})
