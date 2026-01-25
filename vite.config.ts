import { defineConfig } from 'vite'

export default defineConfig({
  // Base path for GitHub Pages - matches your repo name
  base: '/digital-twin-viewer/',

  build: {
    outDir: 'dist',
    // Copy public folder assets
    assetsDir: 'assets',
  },

  // Ensure proper MIME types for WASM files (used by IFC libraries)
  optimizeDeps: {
    exclude: ['@thatopen/components', '@thatopen/components-front']
  }
})
