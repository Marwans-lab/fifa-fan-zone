import { defineConfig } from 'vite'
import angular from '@analogjs/vite-plugin-angular'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: {
    mainFields: ['module'],
  },
  plugins: [angular(), react()],
  base: '/fifa-fan-zone/',
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          'bg-removal': ['@imgly/background-removal'],
        },
      },
      external: [],
    },
  },
})
