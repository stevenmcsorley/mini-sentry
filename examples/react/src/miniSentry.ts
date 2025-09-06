export type MiniSentryOptions = {
  token: string
  baseUrl?: string // default '' to use dev proxy
  release?: string
  environment?: string
  app?: string
}

export function initMiniSentry(opts: MiniSentryOptions) {
  const base = opts.baseUrl ?? ''
  async function send(payload: any) {
    try {
      await fetch(`${base}/api/events/ingest/token/${opts.token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: payload.level || 'error',
          release: opts.release,
          environment: opts.environment || 'development',
          app: opts.app,
          message: payload.message,
          stack: payload.stack,
          frames: payload.frames,
          extra: payload.extra,
        }),
        keepalive: true,
      })
    } catch {
      // ignore in example
    }
  }

  window.addEventListener('error', (e) => {
    const message = (e as any).error?.message || (e as any).message || 'Uncaught error'
    const stack = (e as any).error?.stack
    send({ message, stack })
  })

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const r: any = e.reason
    const message = typeof r === 'string' ? r : r?.message || 'Unhandled rejection'
    const stack = typeof r === 'object' && r?.stack ? r.stack : undefined
    send({ message, stack })
  })

  async function sendSession(status: 'ok' | 'crashed') {
    try {
      await fetch(`${base}/api/sessions/ingest/token/${opts.token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: Math.random().toString(36).slice(2),
          status,
          release: opts.release || '1.0.0',
          environment: opts.environment || 'development',
          user: 'react-example-user',
          duration_ms: status === 'ok' ? 1200 : 0,
        }),
        keepalive: true,
      })
    } catch {}
  }

  return {
    captureException: (err: any, extra?: Record<string, any>) =>
      send({ message: err?.message || String(err), stack: err?.stack, extra }),
    captureMessage: (message: string, extra?: Record<string, any>) => send({ message, extra }),
    sendSession,
  }
}

