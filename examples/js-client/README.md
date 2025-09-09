# Mini Sentry JS Client (no TypeScript)

Two drop-in variants for apps without TypeScript or Vite.

- `miniSentry.js` — ES module. Use with bundlers (CRA/webpack, Next.js, Parcel) or in modern browsers with `<script type="module">`.
- `miniSentry.iife.js` — IIFE build for direct `<script>` usage; exposes `window.MiniSentry.initMiniSentry`.

## 1) ES module usage

```js
// miniSentry.js — copy into your app and import it
import { initMiniSentry } from './miniSentry.js'

const ms = initMiniSentry({
  token: 'YOUR_INGEST_TOKEN',
  baseUrl: 'http://localhost:8000', // '' if same-origin with a dev proxy for /api
  release: '1.0.0',
  environment: 'development',
  app: 'my-react-app',
})

// Optional manual reporting
ms.captureMessage('hello from app', { level: 'info' })
ms.captureException(new Error('boom'), { level: 'error', where: 'init' })
ms.sendSession('ok')
```

In React, call `initMiniSentry` once during startup (e.g., in `index.js` before `createRoot`).

Initialize once, reuse everywhere

Create a single shared client and import it where needed — do not re‑initialize per component.

```js
// src/msClient.js
import { initMiniSentry } from './miniSentry.js'
export const ms = initMiniSentry({
  token: process.env.REACT_APP_MS_TOKEN || 'PASTE_TOKEN',
  baseUrl: process.env.REACT_APP_MS_BASE || 'http://localhost:8000',
  release: process.env.REACT_APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  app: 'my-react-app',
})
export const capture = {
  message: (msg, extra) => ms.captureMessage(msg, extra),
  exception: (err, extra) => ms.captureException(err, extra),
}

// src/index.js (or App.js)
import { ms } from './msClient'

// Any component/file
import { capture } from '../msClient'
capture.message('clicked X', { level: 'info' })
```

React Error Boundary (optional)

If you install the published package `mini-sentry-client`, it provides a React ErrorBoundary to capture render errors automatically. For plain JS apps you can still use it — the package ships compiled JS; types are optional.

```bash
npm install mini-sentry-client
```

```js
// JS usage with the package (no TS required)
import { initMiniSentry, MiniSentryErrorBoundary } from 'mini-sentry-client'
const ms = initMiniSentry({ token: 'PASTE_TOKEN', baseUrl: 'http://localhost:8000' })
// ...
createRoot(el).render(
  <MiniSentryErrorBoundary client={ms}>
    <App />
  </MiniSentryErrorBoundary>
)
```

Or use the CDN version:

```html
<script src="https://cdn.jsdelivr.net/npm/mini-sentry-client/dist/index.global.js"></script>
<script>
  const ms = window.MiniSentry.init({ token: 'PASTE_TOKEN', baseUrl: 'http://localhost:8000' })
</script>
```

## 2) IIFE usage (no bundler/modules)

```html
<script src="/path/to/miniSentry.iife.js"></script>
<script>
  const ms = window.MiniSentry.initMiniSentry({
    token: 'YOUR_INGEST_TOKEN',
    baseUrl: 'http://localhost:8000',
    release: '1.0.0',
    environment: 'development',
    app: 'plain-js-app',
  })
  ms.captureMessage('hello', { level: 'warning' })
</script>
```

## Notes

- Cross-origin: if your UI runs on a different origin than the Mini Sentry backend, set `baseUrl` and enable CORS on the backend or use a dev proxy for `/api`.
- Levels: you can pass `{ level: 'warning' }` or `{ severity: 'warning' }` — the client forwards either; server normalizes levels.
- Symbolication: build with sourcemaps and upload the generated `*.map` files to a Release that matches `release` + `environment` on events.
- Sessions: `sendSession('ok'|'crashed'|'errored'|'init'|'exited', fields?)` is supported by the backend; this minimal JS client shows `'ok'|'crashed'` for brevity.

## Add custom errors and Axios integration

You can send your own messages/exceptions anywhere:

```js
ms.captureMessage('user opened opportunities', {
  level: 'info',
  where: 'opportunities',
  userId: currentUser?.id,
})

try {
  riskyThing()
} catch (err) {
  ms.captureException(err, { level: 'error', where: 'riskyThing' })
}
```

To capture API failures centrally (Axios):

```js
import axios from 'axios'
import { initMiniSentry } from './miniSentry' // path to the copied file

const ms = initMiniSentry({ token: '…', baseUrl: 'http://localhost:8000', release: '1.0.0', environment: 'development', app: 'my-app' })

// Install once, e.g., in your app bootstrap
const id = axios.interceptors.response.use(
  (res) => res,
  (error) => {
    ms.captureException(error, {
      level: 'error',
      where: 'axios',
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
    })
    return Promise.reject(error)
  }
)
// Optional: eject on teardown
// axios.interceptors.response.eject(id)
```

## Dev proxy vs baseUrl

- Same origin (recommended for dev): set up a dev proxy so `/api` goes to the backend, then use `baseUrl: ''`.
  - CRA `src/setupProxy.js`:
    ```js
    const { createProxyMiddleware } = require('http-proxy-middleware')
    module.exports = function(app) {
      app.use('/api', createProxyMiddleware({ target: 'http://localhost:8000', changeOrigin: true }))
    }
    ```
- Different origin: use `baseUrl: 'http://localhost:8000'` and enable CORS on the backend.
