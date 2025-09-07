# Next.js example (pages router)

Minimal setup to report errors from API routes and client.

## API route error reporting

```
// pages/api/boom.js
export default function handler(req, res) {
  try {
    throw new Error('Deliberate error from Next API')
  } catch (err) {
    fetch((process.env.MS_BASE || 'http://localhost:8000') + `/api/events/ingest/token/${process.env.MS_TOKEN}/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: err.message, level: 'error', stack: err.stack, release: '1.0.0', environment: process.env.NODE_ENV })
    }).catch(()=>{})
    res.status(500).json({ ok:false })
  }
}
```

## Client init (capture window errors)

```
// pages/_app.js
import { initMiniSentry } from '../lib/miniSentry' // copy examples/js-client/miniSentry.js
const ms = initMiniSentry({ token: process.env.NEXT_PUBLIC_MS_TOKEN, baseUrl: process.env.NEXT_PUBLIC_MS_BASE || 'http://localhost:8000', release: '1.0.0', environment: process.env.NODE_ENV })
export default function App({ Component, pageProps }) { return <Component {...pageProps} /> }
```

Set env: `NEXT_PUBLIC_MS_TOKEN`, `NEXT_PUBLIC_MS_BASE`.

