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
  },
  build: {
    // Enable code splitting for optimized bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'utils-vendor': ['axios', 'jwt-decode', 'react-toastify']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Minify code
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Enable source maps only in development
    sourcemap: false,
    // Optimize asset inlining
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    // CSS code splitting
    cssCodeSplit: true,
    // Optimize output
    reportCompressedSize: true,
    // Target modern browsers for smaller bundle
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14']
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: []
  }
})
