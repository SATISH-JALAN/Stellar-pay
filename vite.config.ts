import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Polyfill for Node.js global object (needed by some StellarWalletsKit dependencies)
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Some packages look for 'buffer' - alias to browser-compatible version
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js packages compatibility
      define: {
        global: 'globalThis',
      },
    },
  },
})
