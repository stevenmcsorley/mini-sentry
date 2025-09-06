import React, { useEffect, useState } from 'react'

type Project = { id: number; name: string; slug: string; ingest_token: string }
type Group = { id: number; title: string; level: string; count: number; last_seen: string }
type Event = { id: number; message: string; level: string; received_at: string }
type Release = { id: number; version: string; environment: string; created_at: string }
type AlertRule = { id: number; name: string; level: string; threshold_count: number; target_type: 'email'|'webhook'; target_value: string }
type Deployment = { id: number; name: string; url: string; environment: string; date_started: string; date_finished?: string; release: number }

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(path, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  useEffect(() => {
    api('/api/projects/').then(setProjects).catch(console.error)
  }, [])
  return { projects, reload: () => api('/api/projects/').then(setProjects) }
}

export function App() {
  const { projects, reload } = useProjects()
  const [selected, setSelected] = useState<Project | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [msg, setMsg] = useState('Example error from UI')
  const [releases, setReleases] = useState<Release[]>([])
  const [rules, setRules] = useState<AlertRule[]>([])
  const [health, setHealth] = useState<any[]>([])
  const [deploys, setDeploys] = useState<Deployment[]>([])
  const [sessionUser, setSessionUser] = useState('user-123')
  const [eventDetails, setEventDetails] = useState<Record<number, any>>({})
  const [editRule, setEditRule] = useState<{threshold: number; window: number; notify: number}>({threshold: 10, window: 5, notify: 60})
  const [series, setSeries] = useState<any[]>([])
  const [range, setRange] = useState<'1h'|'24h'>('24h')
  const [interval, setInterval] = useState<'5m'|'1h'>('5m')

  useEffect(() => {
    if (!selected) return
    api(`/api/groups/?project=${selected.slug}`).then(setGroups)
    api(`/api/events/?project=${selected.slug}`).then(setEvents).catch(() => {})
    api(`/api/releases/?project=${selected.slug}`).then(setReleases).catch(() => {})
    api(`/api/alert-rules/?project=${selected.slug}`).then(setRules).catch(() => {})
    api(`/api/releases/health/?project=${selected.slug}`).then(setHealth).catch(() => {})
    api(`/api/deployments/?project=${selected.slug}`).then(setDeploys).catch(() => {})
    api(`/api/releases/health/series/?project=${selected.slug}&range=${range}&interval=${interval}`).then(setSeries).catch(() => {})
  }, [selected])

  const createProject = async (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await api('/api/projects/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })
    reload()
  }

  const sendEvent = async () => {
    if (!selected) return
    await api(`/api/events/ingest/token/${selected.ingest_token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, level: 'error', ui: true }),
    })
    // refresh
    setTimeout(() => {
      api(`/api/groups/?project=${selected.slug}`).then(setGroups)
      api(`/api/events/?project=${selected.slug}`).then(setEvents).catch(() => {})
    }, 500)
  }

  const createRelease = async (version: string, environment: string) => {
    if (!selected) return
    await api('/api/releases/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: selected.id, version, environment }),
    })
    api(`/api/releases/?project=${selected.slug}`).then(setReleases)
    api(`/api/releases/health/?project=${selected.slug}`).then(setHealth)
  }

  const createDeployment = async (name: string, url: string, environment: string, releaseId?: number) => {
    if (!selected) return
    if (!releaseId && releases.length === 0) return
    const rid = releaseId || releases[0].id
    await api('/api/deployments/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: selected.id, release: rid, name, url, environment })
    })
    api(`/api/deployments/?project=${selected.slug}`).then(setDeploys)
  }

  const uploadArtifact = async (releaseId: number, name: string, content: string) => {
    await api(`/api/releases/${releaseId}/artifacts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, content_type: 'application/json' }),
    })
  }

  const createRule = async (name: string, level: string, threshold: number, targetType: 'email'|'webhook', targetValue: string) => {
    if (!selected) return
    await api('/api/alert-rules/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: selected.id, name, level, threshold_count: threshold, target_type: targetType, target_value: targetValue }),
    })
    api(`/api/alert-rules/?project=${selected.slug}`).then(setRules)
  }

  const fetchEvent = async (id: number) => {
    const d = await api(`/api/events/${id}/`)
    setEventDetails(prev => ({...prev, [id]: d}))
  }

  const updateFirstRule = async () => {
    if (!selected || rules.length === 0) return
    const id = rules[0].id
    await api(`/api/alert-rules/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold_count: editRule.threshold, threshold_window_minutes: editRule.window, notify_interval_minutes: editRule.notify })
    })
    api(`/api/alert-rules/?project=${selected.slug}`).then(setRules)
  }

  const sendSession = async (status: 'init'|'ok'|'errored'|'crashed'|'exited') => {
    if (!selected) return
    const sessionId = Math.random().toString(36).slice(2)
    await api(`/api/sessions/ingest/token/${selected.ingest_token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, status, user: sessionUser, release: releases[0]?.version || '1.0.0', environment: 'production', duration_ms: status==='ok'? 1200 : 0 })
    })
    api(`/api/releases/health/?project=${selected.slug}`).then(setHealth)
    api(`/api/releases/health/series/?project=${selected.slug}&range=${range}&interval=${interval}`).then(setSeries)
  }

  const refreshSeries = () => {
    if (!selected) return
    api(`/api/releases/health/series/?project=${selected.slug}&range=${range}&interval=${interval}`).then(setSeries)
  }

  const snoozeGroup = async (groupId: number, minutes = 60) => {
    if (!selected || rules.length === 0) return
    const ruleId = rules[0].id
    await api(`/api/alert-rules/${ruleId}/snooze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: groupId, minutes })
    })
    alert('Snoozed alerts for this group')
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Mini Sentry UI</h1>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 320 }}>
          <h3>Projects</h3>
          <ProjectForm onCreate={createProject} />
          <ul>
            {projects.map(p => (
              <li key={p.id}>
                <button onClick={() => setSelected(p)} style={{ background: 'none', border: 'none', color: '#0b5fff', cursor: 'pointer' }}>
                  {p.slug}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          {selected ? (
            <>
              <h3>Project: {selected.name} <span style={{ color: '#666' }}>({selected.slug})</span></h3>
              <p>Token: <code>{selected.ingest_token}</code></p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input value={msg} onChange={e => setMsg(e.target.value)} style={{ padding: 6, width: 360 }} />
                <button onClick={sendEvent}>Send test event</button>
              </div>
              <h4>Releases</h4>
              <ReleaseForm onCreate={createRelease} />
              <table>
                <thead><tr><th>Version</th><th>Env</th><th>Created</th><th>Artifact</th></tr></thead>
                <tbody>
                  {releases.map(r => (
                    <tr key={r.id}>
                      <td>{r.version}</td>
                      <td>{r.environment}</td>
                      <td>{r.created_at}</td>
                      <td><ArtifactForm releaseId={r.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4>Deployments</h4>
              <DeploymentForm onCreate={createDeployment} />
              <table>
                <thead><tr><th>Name</th><th>Env</th><th>Started</th><th>Finished</th><th>URL</th></tr></thead>
                <tbody>
                  {deploys.map(d => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{d.environment}</td>
                      <td>{d.date_started}</td>
                      <td>{d.date_finished || ''}</td>
                      <td>{d.url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4>Release Health</h4>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
                  <input value={sessionUser} onChange={e => setSessionUser(e.target.value)} placeholder="user id" style={{ padding: 6 }} />
                  <button onClick={() => sendSession('ok')}>Send ok session</button>
                  <button onClick={() => sendSession('crashed')}>Send crashed session</button>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
                  <label>Range</label>
                  <select value={range} onChange={e => setRange(e.target.value as any)}>
                    <option value="1h">1h</option>
                    <option value="24h">24h</option>
                  </select>
                  <label>Interval</label>
                  <select value={interval} onChange={e => setInterval(e.target.value as any)}>
                    <option value="5m">5m</option>
                    <option value="1h">1h</option>
                  </select>
                  <button onClick={refreshSeries}>Refresh</button>
                </div>
                <table>
                  <thead><tr><th>Bucket</th><th>Total</th><th>Crashed</th><th>Crash-free %</th></tr></thead>
                  <tbody>
                    {series.map((b, idx) => (
                      <tr key={idx}>
                        <td>{b.bucket}</td>
                        <td>{b.total}</td>
                        <td>{b.crashed}</td>
                        <td>{b.total === 0 ? 100 : Math.round(100 * (b.total - b.crashed) / b.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table>
                  <thead><tr><th>Version</th><th>Env</th><th>Total</th><th>Crashed</th><th>Crash-free %</th></tr></thead>
                  <tbody>
                    {health.map((h, idx) => (
                      <tr key={idx}>
                        <td>{h.version}</td>
                        <td>{h.environment}</td>
                        <td>{h.total_sessions}</td>
                        <td>{h.crashed_sessions}</td>
                        <td>{h.crash_free_rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h4>Alert Rules</h4>
              <AlertRuleForm onCreate={createRule} />
              {rules.length>0 && (
                <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
                  <input type="number" value={editRule.threshold} onChange={e => setEditRule({...editRule, threshold: parseInt(e.target.value)})} placeholder="threshold" style={{ padding: 6, width: 100 }} />
                  <input type="number" value={editRule.window} onChange={e => setEditRule({...editRule, window: parseInt(e.target.value)})} placeholder="window (min)" style={{ padding: 6, width: 120 }} />
                  <input type="number" value={editRule.notify} onChange={e => setEditRule({...editRule, notify: parseInt(e.target.value)})} placeholder="notify (min)" style={{ padding: 6, width: 120 }} />
                  <button onClick={updateFirstRule}>Update first rule</button>
                </div>
              )}
              {rules.length>0 && <AddTargetForm ruleId={rules[0].id} onAdded={() => api(`/api/alert-rules/?project=${selected!.slug}`).then(setRules)} />}
              <table>
                <thead><tr><th>Name</th><th>Level</th><th>Threshold</th><th>Target</th></tr></thead>
                <tbody>
                  {rules.map(r => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.level || 'any'}</td>
                      <td>{r.threshold_count}</td>
                      <td>{r.target_type}: {r.target_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4>Groups</h4>
              <table>
                <thead><tr><th>Last Seen</th><th>Level</th><th>Title</th><th>Count</th><th>Actions</th></tr></thead>
                <tbody>
                  {groups.map(g => (
                    <tr key={g.id}>
                      <td>{g.last_seen}</td>
                      <td>{g.level}</td>
                      <td>{g.title}</td>
                      <td>{g.count}</td>
                      <td>{rules.length>0 ? <button onClick={() => snoozeGroup(g.id, 60)}>Snooze 60m</button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4>Recent Events</h4>
              <table>
                <thead><tr><th>Time</th><th>Level</th><th>Message</th><th>Stack</th></tr></thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.id}>
                      <td>{e.received_at}</td>
                      <td>{e.level}</td>
                      <td>{e.message}</td>
                      <td>
                        <button onClick={() => fetchEvent(e.id)}>View</button>
                        {eventDetails[e.id]?.symbolicated?.frames ? (
                          <pre style={{ maxHeight: 160, overflow: 'auto' }}>{JSON.stringify(eventDetails[e.id].symbolicated.frames, null, 2)}</pre>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>Select a project to view groups and events.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectForm({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState('My App')
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" style={{ padding: 6 }} />
      <button onClick={() => onCreate(name)}>Create</button>
    </div>
  )}

function ReleaseForm({ onCreate }: { onCreate: (version: string, env: string) => void }) {
  const [version, setVersion] = useState('1.0.0')
  const [env, setEnv] = useState('production')
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
      <input value={version} onChange={e => setVersion(e.target.value)} placeholder="Version" style={{ padding: 6 }} />
      <input value={env} onChange={e => setEnv(e.target.value)} placeholder="Environment" style={{ padding: 6 }} />
      <button onClick={() => onCreate(version, env)}>Create Release</button>
    </div>
  )
}

function ArtifactForm({ releaseId }: { releaseId: number }) {
  const [content, setContent] = useState('{"function_map":{"minifiedFn":"Original.Name"}}')
  const [name, setName] = useState('symbols.json')
  const upload = async () => {
    await api(`/api/releases/${releaseId}/artifacts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, content_type: 'application/json' }),
    })
    alert('Uploaded')
  }
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input value={name} onChange={e => setName(e.target.value)} style={{ padding: 6, width: 160 }} />
      <input value={content} onChange={e => setContent(e.target.value)} style={{ padding: 6, width: 320 }} />
      <button onClick={upload}>Upload</button>
    </div>
  )
}

function AlertRuleForm({ onCreate }: { onCreate: (name: string, level: string, threshold: number, targetType: 'email'|'webhook', targetValue: string) => void }) {
  const [name, setName] = useState('High error volume')
  const [level, setLevel] = useState('error')
  const [threshold, setThreshold] = useState(10)
  const [targetType, setTargetType] = useState<'email'|'webhook'>('email')
  const [targetValue, setTargetValue] = useState('alerts@example.test')
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Rule name" style={{ padding: 6, width: 180 }} />
      <input value={level} onChange={e => setLevel(e.target.value)} placeholder="Level (blank=any)" style={{ padding: 6, width: 140 }} />
      <input type="number" value={threshold} onChange={e => setThreshold(parseInt(e.target.value))} style={{ padding: 6, width: 100 }} />
      <select value={targetType} onChange={e => setTargetType(e.target.value as any)} style={{ padding: 6 }}>
        <option value="email">email</option>
        <option value="webhook">webhook</option>
      </select>
      <input value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="Email or webhook URL" style={{ padding: 6, width: 240 }} />
      <button onClick={() => onCreate(name, level, threshold, targetType, targetValue)}>Add</button>
    </div>
  )
}

function DeploymentForm({ onCreate }: { onCreate: (name: string, url: string, env: string, releaseId?: number) => void }) {
  const [name, setName] = useState('Deploy #1')
  const [url, setUrl] = useState('https://example.com')
  const [env, setEnv] = useState('production')
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={{ padding: 6, width: 180 }} />
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" style={{ padding: 6, width: 240 }} />
      <input value={env} onChange={e => setEnv(e.target.value)} placeholder="Environment" style={{ padding: 6, width: 140 }} />
      <button onClick={() => onCreate(name, url, env)}>Create</button>
    </div>
  )
}

function AddTargetForm({ ruleId, onAdded }: { ruleId: number, onAdded: () => void }) {
  const [type, setType] = useState<'email'|'webhook'>('email')
  const [value, setValue] = useState('alerts@example.test')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const add = async () => {
    await api(`/api/alert-rules/${ruleId}/targets/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: type, target_value: value, subject_template: subject, body_template: body })
    })
    onAdded()
  }
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
      <select value={type} onChange={e => setType(e.target.value as any)} style={{ padding: 6 }}>
        <option value='email'>email</option>
        <option value='webhook'>webhook</option>
      </select>
      <input value={value} onChange={e => setValue(e.target.value)} placeholder='target' style={{ padding: 6, width: 220 }} />
      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder='subject template (optional)' style={{ padding: 6, width: 220 }} />
      <input value={body} onChange={e => setBody(e.target.value)} placeholder='body template (optional)' style={{ padding: 6, width: 260 }} />
      <button onClick={add}>Add target</button>
    </div>
  )
}
