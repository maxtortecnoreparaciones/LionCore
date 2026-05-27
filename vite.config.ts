import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'fix-electron-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/\s+crossorigin(="[^"]*"|='[^']*'|)?/g, '')
      }
    }
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  base: '/',
})