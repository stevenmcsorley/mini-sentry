import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initMiniSentry, MiniSentryErrorBoundary } from '@mini-sentry/client'

// Expect VITE_MS_TOKEN to be set in .env.local
const token = import.meta.env.VITE_MS_TOKEN as string
if (!token) {
  console.warn('Set VITE_MS_TOKEN in examples/react/.env.local')
}

const ms = initMiniSentry({
  token: token || 'MISSING_TOKEN',
  // Use dev proxy for /api (see vite.config.ts)
  baseUrl: '',
  release: '1.0.0',
  environment: 'development',
  app: 'react-example',
})

createRoot(document.getElementById('root')!).render(
  <MiniSentryErrorBoundary client={ms}>
    <App ms={ms} />
  </MiniSentryErrorBoundary>
)
