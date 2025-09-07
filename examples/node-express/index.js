import express from 'express'
import fetch from 'node-fetch'

const app = express()
const PORT = 4000
const BASE = process.env.MS_BASE || 'http://localhost:8000'
const TOKEN = process.env.MS_TOKEN || 'PASTE_INGEST_TOKEN'

async function sendEvent(payload) {
  await fetch(`${BASE}/api/events/ingest/token/${TOKEN}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level: payload.level || 'error',
      message: payload.message,
      stack: payload.stack,
      extra: payload.extra,
      release: '1.0.0',
      environment: 'development',
      app: 'node-express-example',
    })
  })
}

app.get('/', (req, res) => res.send('OK'))
app.get('/boom', async (req, res) => {
  try {
    throw new Error('Deliberate error from Express')
  } catch (err) {
    await sendEvent({ message: err.message, stack: err.stack, level: 'error' })
    res.status(500).send('Reported error')
  }
})

app.listen(PORT, () => console.log(`Express listening on http://localhost:${PORT}`))

