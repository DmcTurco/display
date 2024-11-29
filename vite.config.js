import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/kitchen_display/tablet/',
  define: {
    'process.env.BASE_URL': JSON.stringify('/kitchen_display/tablet')
  }
})
