import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    outDir: './dist'
  },
  server: {
    proxy: {
      "/api": {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,      
        ws: true,
      },
      '/socket.io/': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    }
  }
})