import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initMiniSentry, MiniSentryErrorBoundary } from './miniSentryClient.tsx'
import './index.css'

// Initialize Mini Sentry client
const miniSentry = initMiniSentry({
  token: import.meta.env.VITE_MINI_SENTRY_TOKEN || 't_BYTD5BscDMRPR807TJ7MdfqRjJEYHdkhr8TE-nnwA',
  baseUrl: import.meta.env.VITE_MINI_SENTRY_URL || 'http://localhost:8000',
  release: '1.0.0-test',
  environment: 'test',
  beforeSend: (event) => {
    // Add test metadata to all events
    return {
      ...event,
      tags: {
        ...event.tags,
        test_app: 'true',
        app_version: '1.0.0-test'
      }
    };
  }
});

// Set initial user context
miniSentry.setUser({
  id: '4',
  email: 'testuser@example.com',
  username: 'testuser'
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MiniSentryErrorBoundary>
      <App />
    </MiniSentryErrorBoundary>
  </React.StrictMode>,
)