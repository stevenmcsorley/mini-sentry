/*
  @mini-sentry/client — minimal browser client for Mini Sentry backend
  - initMiniSentry installs window error + unhandledrejection handlers
  - captureException / captureMessage send manual events
  - sendSession reports session health (ok/crashed)
  - MiniSentryErrorBoundary catches React render errors
*/

import React from 'react'

export type MiniSentryOptions = {
  token: string
  baseUrl?: string // e.g., 'http://localhost:8000' or '' if proxied
  release?: string
  environment?: string
  app?: string
}

export type MiniSentryClient = {
  captureException: (err: any, extra?: Record<string, any>) => Promise<void>
  captureMessage: (message: string, extra?: Record<string, any>) => Promise<void>
  sendSession: (status: 'ok' | 'crashed' | 'errored' | 'init' | 'exited', fields?: Partial<SessionPayload>) => Promise<void>
}

type EventPayload = {
  message: string
  level?: 'error' | 'warning' | 'info'
  stack?: string
  frames?: any[]
  extra?: Record<string, any>
}

type SessionPayload = {
  session_id: string
  status: 'ok' | 'crashed' | 'errored' | 'init' | 'exited'
  release?: string
  environment?: string
  user?: string
  duration_ms?: number
}

function nowSessionId() {
  return Math.random().toString(36).slice(2)
}

export function initMiniSentry(opts: MiniSentryOptions): MiniSentryClient {
  const base = opts.baseUrl ?? ''
  const token = opts.token
  const defaultMeta = {
    release: opts.release,
    environment: opts.environment ?? 'production',
    app: opts.app,
  }

  async function post(path: string, body: any) {
    try {
      await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      })
    } catch {
      // swallow in client
    }
  }

  async function sendEvent(payload: EventPayload) {
    return post(`/api/events/ingest/token/${token}/`, {
      level: payload.level || 'error',
      message: payload.message,
      stack: payload.stack,
      frames: payload.frames,
      extra: payload.extra,
      ...defaultMeta,
    })
  }

  async function sendSession(status: SessionPayload['status'], fields?: Partial<SessionPayload>) {
    const body: SessionPayload = {
      session_id: fields?.session_id || nowSessionId(),
      status,
      release: fields?.release || (defaultMeta.release as string) || '1.0.0',
      environment: fields?.environment || (defaultMeta.environment as string) || 'production',
      user: fields?.user,
      duration_ms: fields?.duration_ms ?? (status === 'ok' ? 1200 : 0),
    }
    return post(`/api/sessions/ingest/token/${token}/`, body)
  }

  // Global handlers (install once per app)
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
      const anyE: any = e as any
      const message = anyE.error?.message || anyE.message || 'Uncaught error'
      const stack = anyE.error?.stack
      void sendEvent({ message, stack })
    })
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      const r: any = e.reason
      const message = typeof r === 'string' ? r : r?.message || 'Unhandled rejection'
      const stack = typeof r === 'object' && r?.stack ? r.stack : undefined
      void sendEvent({ message, stack })
    })
  }

  return {
    captureException: async (err: any, extra?: Record<string, any>) =>
      sendEvent({ message: err?.message || String(err), stack: err?.stack, extra, level: (extra as any)?.level || (extra as any)?.severity }),
    captureMessage: async (message: string, extra?: Record<string, any>) => sendEvent({ message, extra, level: (extra as any)?.level || (extra as any)?.severity }),
    sendSession,
  }
}

export class MiniSentryErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    client: MiniSentryClient
    fallback?: React.ReactNode
  }>,
  { hasError: boolean }
> {
  state: { hasError: boolean } = { hasError: false }

  componentDidCatch(error: any, info: any) {
    this.props.client.captureException(error, { componentStack: info?.componentStack })
    this.setState({ hasError: true })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? React.createElement('h1', null, 'Something went wrong.')
    }
    return (this.props as any).children as any
  }
}

// For IIFE global usage, tsup will expose window.MiniSentry.init
export const init = initMiniSentry
