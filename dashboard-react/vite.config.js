import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api-ana': {
        target: 'https://www.ana.gov.br/hidrowebservice',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-ana/, ''),
        secure: false,
      },
    },
  },
})

