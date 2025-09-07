# Node.js (Express) example

Minimal Express server that reports errors to Mini Sentry.

## Setup

```
cd examples/node-express
npm init -y
npm i express node-fetch@3
```

## Run

```
node index.js
# then visit http://localhost:4000/boom
```

This will POST an event to your Mini Sentry backend at `MS_BASE` (defaults to `http://localhost:8000`).

Env vars:
- `MS_BASE` — backend origin (e.g., `http://localhost:8000`)
- `MS_TOKEN` — project ingest token (from Mini Sentry UI)

`index.js` sends `{ message, level, stack, extra, release, environment }`.

## Error-handling middleware (automatic capture)

You can add a global error handler that forwards uncaught route errors automatically:

```js
import express from 'express'
import { createMiniSentryErrorMiddleware } from './msMiddleware.js'

const app = express()
app.get('/boom', (req, res) => { throw new Error('boom') })

// Register just before the default Express error handler
app.use(createMiniSentryErrorMiddleware({ baseUrl: process.env.MS_BASE || 'http://localhost:8000', token: process.env.MS_TOKEN }))

// Default error handler
app.use((err, req, res, next) => res.status(500).send('Server error'))

app.listen(4000)
```

