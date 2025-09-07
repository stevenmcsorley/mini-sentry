import React, { useEffect, useMemo, useState } from 'react'

type MSClient = {
  captureException: (err: any, extra?: Record<string, any>) => Promise<void>
  captureMessage: (message: string, extra?: Record<string, any>) => Promise<void>
  sendSession: (status: 'ok' | 'crashed' | 'errored' | 'init' | 'exited', fields?: any) => Promise<void>
}

export function App({ ms }: { ms: MSClient }) {
  const [projectSlug, setProjectSlug] = useState<string>((import.meta as any).env.VITE_PROJECT_SLUG || 'my-app')
  const [release, setRelease] = useState('1.0.0')
  const [env, setEnv] = useState('development')
  const [apiBase, setApiBase] = useState<string>((import.meta as any).env.VITE_API_BASE || '')
  const [project, setProject] = useState<any>(null)
  const [lastRelease, setLastRelease] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  const api = useMemo(() => {
    return async function api(path: string, init?: RequestInit) {
      const url = `${apiBase}${path}`
      const r = await fetch(url, init)
      const text = await r.text()
      if (!r.ok) throw new Error(`${r.status} ${text}`)
      try { return JSON.parse(text) } catch { return text }
    }
  }, [apiBase])

  const loadProject = async () => {
    const projects = await api(`/api/projects/`)
    const p = projects.find((x: any) => x.slug === projectSlug)
    if (!p) throw new Error(`Project not found: ${projectSlug}`)
    setProject(p)
    return p
  }

  useEffect(() => { loadProject().catch(err => setResult(String(err))) }, [])

  const throwError = () => {
    const t = () => { throw new Error('Deliberate error from React example') }
    const s = () => t()
    s()
  }
  const sendMessage = () => ms.captureMessage('A test message from React example', { foo: 'bar', level: 'error' })
  const sendWarning = () => ms.captureMessage('A warning from React example', { level: 'warning' })
  const sendInfo = () => ms.captureMessage('An info from React example', { level: 'info' })
  const spamErrors = async () => { for (let i = 0; i < 10; i++) try { throwError() } catch { /* global handler */ } }

  const ensureRelease = async () => {
    const p = project || await loadProject()
    // Try to find an existing release first (idempotent)
    try {
      const rels = await api(`/api/releases/?project=${projectSlug}`)
      const existing = (rels || []).find((r: any) => r.version === release && r.environment === env)
      if (existing) { setLastRelease(existing); setResult(existing); return existing }
    } catch {}
    // Create if not found
    const created = await api(`/api/releases/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: p.id, version: release, environment: env })
    })
    setLastRelease(created)
    setResult(created)
    return created
  }

  const uploadFunctionMap = async () => {
    const rel = lastRelease || (await ensureRelease())
    const content = JSON.stringify({ function_map: { t: 'throwError' } })
    const res = await api(`/api/releases/${rel.id}/artifacts/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'symbols.json', content, content_type: 'application/json' })
    })
    setResult(res)
  }

  const createAlertRule = async () => {
    const p = project || await loadProject()
    const res = await api(`/api/alert-rules/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: p.id, name: 'High error volume', level: 'error', threshold_count: 5, threshold_window_minutes: 1, notify_interval_minutes: 1, target_type: 'email', target_value: 'alerts@example.test' })
    })
    setResult(res)
  }

  const snoozeLatestGroup = async () => {
    const groups = await api(`/api/groups/?project=${projectSlug}`)
    if (!groups?.length) throw new Error('No groups yet')
    const rules = await api(`/api/alert-rules/?project=${projectSlug}`)
    if (!rules?.length) throw new Error('No alert rules; create one first')
    const res = await api(`/api/alert-rules/${rules[0].id}/snooze/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: groups[0].id, minutes: 60 })
    })
    setResult(res)
  }

  const unsnoozeLatestGroup = async () => {
    const groups = await api(`/api/groups/?project=${projectSlug}`)
    const rules = await api(`/api/alert-rules/?project=${projectSlug}`)
    const res = await api(`/api/alert-rules/${rules[0].id}/unsnooze/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: groups[0].id })
    })
    setResult(res)
  }

  const deployment = async () => {
    const p = project || await loadProject()
    const rel = lastRelease || (await ensureRelease())
    const res = await api(`/api/deployments/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: p.id, release: rel.id, environment: env, name: 'Deploy #demo', url: 'https://example.com' })
    })
    setResult(res)
  }

  const chEvents = async () => {
    const res = await api(`/api/events/clickhouse?project=${projectSlug}&limit=5`)
    setResult(res)
  }

  const healthSeries = async () => {
    const res = await api(`/api/releases/health/series/?project=${projectSlug}&range=1h&interval=5m&backend=ch`)
    setResult(res)
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 1024 }}>
      <h1>React Example — Mini Sentry Test Lab</h1>
      <p>This page can trigger everything the backend supports: events, sessions, alerts, releases, artifacts, deployments, and ClickHouse queries.</p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
        <section>
          <h3>Config</h3>
          <label>Project Slug <input value={projectSlug} onChange={e => setProjectSlug(e.target.value)} /></label><br />
          <label>Release <input value={release} onChange={e => setRelease(e.target.value)} /></label><br />
          <label>Environment <input value={env} onChange={e => setEnv(e.target.value)} /></label><br />
          <label>API Base <input value={apiBase} onChange={e => setApiBase(e.target.value)} placeholder="(empty uses dev proxy)" /></label><br />
          <button onClick={loadProject}>Reload Project</button>
        </section>
        <section>
          <h3>Events</h3>
          <button onClick={throwError}>Throw error (stack)</button>
          <button onClick={sendMessage}>Send error message</button>
          <button onClick={sendInfo}>Send info</button>
          <button onClick={sendWarning}>Send warning</button>
          <button onClick={spamErrors}>Spam 10 errors</button>
        </section>
        <section>
          <h3>Sessions</h3>
          <button onClick={() => ms.sendSession('ok', { release, environment: env })}>Send ok session</button>
          <button onClick={() => ms.sendSession('crashed', { release, environment: env })}>Send crashed session</button>
        </section>
        <section>
          <h3>Releases & Artifacts</h3>
          <button onClick={ensureRelease}>Create release</button>
          <button onClick={uploadFunctionMap}>Upload sample function_map</button>
        </section>
        <section>
          <h3>Alerts</h3>
          <button onClick={createAlertRule}>Create alert rule</button>
          <button onClick={snoozeLatestGroup}>Snooze latest group (60m)</button>
          <button onClick={unsnoozeLatestGroup}>Unsnooze latest group</button>
        </section>
        <section>
          <h3>Deployments</h3>
          <button onClick={deployment}>Create deployment</button>
        </section>
        <section>
          <h3>ClickHouse</h3>
          <button onClick={chEvents}>Query events (CH)</button>
          <button onClick={healthSeries}>Health series (CH)</button>
        </section>
      </div>
      <h3 style={{ marginTop: 16 }}>Result</h3>
      <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 6, maxHeight: 320, overflow: 'auto' }}>{result ? JSON.stringify(result, null, 2) : 'Click a button to see result here.'}</pre>
      <p>Open the Mini Sentry UI (http://localhost:5173) and refresh Groups/Events/Health to see data appear. For readable stacks, build + upload sourcemaps, then use Preview mode and “Throw error”.</p>
    </div>
  )
}

export default App
