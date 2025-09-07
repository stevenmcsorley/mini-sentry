(function (global) {
  function initMiniSentry(opts) {
    const base = opts.baseUrl || ''

    async function post(path, body) {
      try {
        await fetch(`${base}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: true,
        })
      } catch (_) {}
    }

    async function send(payload) {
      const level = (payload && (payload.level || payload.severity)) || 'error'
      return post(`/api/events/ingest/token/${opts.token}/`, {
        level,
        release: opts.release,
        environment: opts.environment || 'development',
        app: opts.app,
        message: payload.message,
        stack: payload.stack,
        frames: payload.frames,
        extra: payload.extra,
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('error', (e) => {
        const message = e?.error?.message || e?.message || 'Uncaught error'
        const stack = e?.error?.stack
        void send({ message, stack })
      })
      window.addEventListener('unhandledrejection', (e) => {
        const r = e?.reason
        const message = typeof r === 'string' ? r : (r && r.message) || 'Unhandled rejection'
        const stack = typeof r === 'object' && r && r.stack ? r.stack : undefined
        void send({ message, stack })
      })
    }

    async function sendSession(status, fields) {
      const body = {
        session_id: (fields && fields.session_id) || Math.random().toString(36).slice(2),
        status,
        release: (fields && fields.release) || opts.release || '1.0.0',
        environment: (fields && fields.environment) || opts.environment || 'development',
        user: fields && fields.user,
        duration_ms: typeof fields?.duration_ms === 'number' ? fields.duration_ms : (status === 'ok' ? 1200 : 0),
      }
      return post(`/api/sessions/ingest/token/${opts.token}/`, body)
    }

    return {
      captureException: (err, extra) =>
        send({ message: err?.message || String(err), stack: err?.stack, extra, level: extra?.level || extra?.severity }),
      captureMessage: (message, extra) =>
        send({ message, extra, level: extra?.level || extra?.severity }),
      sendSession,
    }
  }

  global.MiniSentry = { initMiniSentry }
})(window);

