import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, '../public/dist'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'src/main.jsx'),
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
})
