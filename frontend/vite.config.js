import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // proxy all /order requests to backend on 8083
      '/order': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
      },
      // add other proxies if needed (e.g., /auth)
    }
  }
})
