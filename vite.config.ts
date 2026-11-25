import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/aurved-admin/',
  // Older phones: iOS 14 and Chrome 80 and up. The default needs iOS 16.4.
  build: { target: ['es2019', 'chrome80', 'safari14', 'firefox78', 'edge88'] },
})
