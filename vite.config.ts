import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return
          if (/\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'vendor-react'
          if (id.includes('/framer-motion/')) return 'vendor-motion'
          if (id.includes('/lucide-react/')) return 'vendor-icons'
        },
      },
    },
  },
})
