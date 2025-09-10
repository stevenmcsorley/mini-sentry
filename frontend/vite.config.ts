/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://web:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/mocks/**',
        '**/*.d.ts',
        '**/*.config.*',
        'src/main.tsx',
      ],
      thresholds: {
        functions: 80,
        lines: 80,
        branches: 80,
        statements: 80
      }
    }
  }
})