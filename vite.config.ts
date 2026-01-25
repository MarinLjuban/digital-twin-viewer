import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  // Use '/' for dev, '/digital-twin-viewer/' for production (GitHub Pages)
  base: command === 'serve' ? '/' : '/digital-twin-viewer/',

  build: {
    outDir: 'dist',
    // Copy public folder assets
    assetsDir: 'assets',
  },

  // Ensure proper MIME types for WASM files (used by IFC libraries)
  optimizeDeps: {
    exclude: ['@thatopen/components', '@thatopen/components-front']
  }
}))
