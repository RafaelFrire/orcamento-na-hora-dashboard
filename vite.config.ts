import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Em desenvolvimento, `/api` é repassado à API: sem CORS e sem expor a URL no código.
      proxy: { '/api': { target: env.API_PROXY_TARGET || 'http://localhost:3000', changeOrigin: true } },
    },
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  }
})
