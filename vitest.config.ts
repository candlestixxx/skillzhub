import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    setupFiles: ['./vitest.setup.ts']
  }
})
