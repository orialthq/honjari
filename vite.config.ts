import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 배포 경로: orialthq.github.io/honjari
export default defineConfig({
  base: '/honjari/',
  plugins: [react()],
})
