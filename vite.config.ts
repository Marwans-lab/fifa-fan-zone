import { defineConfig } from 'vite'
import angular from '@analogjs/vite-plugin-angular'

export default defineConfig({
  resolve: {
    mainFields: ['module'],
  },
  // Angular plugin must come first.
  plugins: [angular()],
  base: '/fifa-fan-zone/',
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  build: {
    target: 'es2015',
  },
})
