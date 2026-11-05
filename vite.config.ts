import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Project site: https://<user>.github.io/birthday-party/
export default defineConfig({
  plugins: [react()],
  base: '/birthday-party/',
})
