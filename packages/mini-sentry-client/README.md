@mini-sentry/client

Lightweight browser client for the Mini Sentry backend.

Features
- Auto-captures window errors and unhandled promise rejections
- captureException / captureMessage helpers
- sendSession for crash-free tracking
- React ErrorBoundary component
- ESM, CJS, and IIFE builds (global MiniSentry)

Install & Build (local/private)

```bash
cd packages/mini-sentry-client
npm install
npm run build
```

Usage (ESM)

```ts
import { initMiniSentry, MiniSentryErrorBoundary } from '@mini-sentry/client'

const ms = initMiniSentry({
  token: import.meta.env.VITE_MS_TOKEN,
  baseUrl: '',            // '' if proxied via dev server, or http(s)://api
  release: '1.0.0',
  environment: import.meta.env.MODE,
  app: 'my-react-app',
})

// Optional React ErrorBoundary
createRoot(el).render(
  <MiniSentryErrorBoundary client={ms}>
    <App />
  </MiniSentryErrorBoundary>
)

// Manual capture
try { throw new Error('boom') } catch (e) { ms.captureException(e) }
ms.captureMessage('hello', { foo: 'bar' })

// Sessions
ms.sendSession('ok')
ms.sendSession('crashed')
```

Usage (UMD/IIFE)

```html
<script src="/path/to/mini-sentry.iife.js"></script>
<script>
  const ms = window.MiniSentry.init({ token: '...', baseUrl: 'http://localhost:8000' })
  ms.captureMessage('hello')
  ms.sendSession('ok')
<\/script>
```

Notes
- Use a dev proxy to avoid CORS locally (Vite `server.proxy` → http://localhost:8000)
- Release + sourcemap upload enables readable stacks; see repo examples/react

