import fetch from 'node-fetch'

function scrubHeaders(headers, keys = ['authorization', 'cookie']) {
  const out = {}
  for (const [k, v] of Object.entries(headers || {})) {
    out[k] = keys.includes(k.toLowerCase()) ? '***' : v
  }
  return out
}

export function createMiniSentryErrorMiddleware({ baseUrl = 'http://localhost:8000', token, release = '1.0.0', environment = 'development', app = 'node-express-app', scrubHeaderKeys = ['authorization', 'cookie'] } = {}) {
  if (!token) throw new Error('MiniSentry: token is required')
  return function miniSentryErrorMiddleware(err, req, res, next) {
    try {
      const payload = {
        level: 'error',
        message: err?.message || String(err),
        stack: err?.stack,
        release,
        environment,
        app,
        extra: {
          method: req.method,
          path: req.originalUrl || req.url,
          query: req.query,
          headers: scrubHeaders(req.headers, scrubHeaderKeys),
          ip: req.ip,
        },
      }
      // fire and forget
      void fetch(`${baseUrl}/api/events/ingest/token/${token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    } catch {}
    next(err)
  }
}

