import React, { useEffect, useState } from 'react'
import { Dashboard } from './Dashboard'
import { OverviewPage } from './components/OverviewPage'
import { LevelBadge } from './components/LevelBadge'
import { AlertRuleForm } from './components/forms/AlertRuleForm'
import { ProjectForm } from './components/forms/ProjectForm'
import { ReleaseForm } from './components/forms/ReleaseForm'
import { ArtifactForm } from './components/forms/ArtifactForm'
import { DeploymentForm } from './components/forms/DeploymentForm'
import { AddTargetForm } from './components/forms/AddTargetForm'
import { TimeRangeMenu } from './components/TimeRangeMenu'
import { NavRail } from './components/NavRail'
import ReactECharts from 'echarts-for-react'
// ECharts core import + components so brush works reliably
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, BrushComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, BrushComponent, CanvasRenderer])

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

// Format an ISO date string into something readable
function fmtDate(iso: string): string {
  try {
    const d = new Date(iso)
    // Use locale defaults with seconds, 24/12h per user locale
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' } as any)
  } catch {
    return iso
  }
}

function asList<T = any>(d: any): T[] {
  if (Array.isArray(d)) return d as T[]
  if (d && Array.isArray((d as any).results)) return (d as any).results as T[]
  return []
}

function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  useEffect(() => {
    api('/api/projects/').then((d) => {
      if (Array.isArray(d)) setProjects(d)
      else if (d && d.results) setProjects(d.results)
      else setProjects([])
    }).catch(console.error)
  }, [])
  return { projects, reload: () => api('/api/projects/').then((d) => {
    if (Array.isArray(d)) setProjects(d)
    else if (d && d.results) setProjects(d.results)
    else setProjects([])
  }) }
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
  const [range, setRange] = useState<'1h'|'24h'|'7d'|'30d'|'90d'|'1y'>('24h')
  const [interval, setInterval] = useState<'1m'|'5m'|'15m'|'30m'|'1h'|'24h'|'7d'|'30d'>('5m')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterEnv, setFilterEnv] = useState('')
  const [filterRelease, setFilterRelease] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'logs'|'overview'|'dashboard'|'projects'>('logs')
  const [initializedFromURL, setInitializedFromURL] = useState(false)
  const [timeSel, setTimeSel] = useState<{from: string; to: string} | null>(null)
  const [eventLimit, setEventLimit] = useState<number>(50)
  const [eventOffset, setEventOffset] = useState<number>(0)
  const [eventTotal, setEventTotal] = useState<number>(0)
  const [customRange, setCustomRange] = useState<{value: number; unit: string; label: string} | null>(null)

  // Read initial state from URL hash on first load
  useEffect(() => {
    if (initializedFromURL) return
    const params = new URLSearchParams(window.location.hash.slice(1))
    const view = params.get('view') as any
    if (view && ['logs','overview','dashboard','projects'].includes(view)) setActiveTab(view)
    const q = params.get('q')
    if (q) setSearch(q)
    const lvl = params.get('level')
    if (lvl) setFilterLevel(lvl)
    const env = params.get('env')
    if (env) setFilterEnv(env)
    const rel = params.get('release')
    if (rel) setFilterRelease(rel)
    const from = params.get('from'); const to = params.get('to')
    if (from && to) setTimeSel({ from, to })
    const lim = params.get('limit'); const off = params.get('offset')
    if (lim) setEventLimit(parseInt(lim, 10) || 50)
    if (off) setEventOffset(parseInt(off, 10) || 0)
    setInitializedFromURL(true)
  }, [initializedFromURL])

  // After projects load, select project from URL or default
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const wanted = params.get('project')
    if (projects.length === 0) return
    if (wanted) {
      const bySlug = projects.find(p => p.slug === wanted)
      if (bySlug) { 
        setSelected(bySlug)
        // Reset to default time range when switching projects
        setRange('24h')
        setInterval('1h')
        setTimeSel(null)
        setCustomRange(null)
        return 
      }
    }
    if (!selected) {
      // Check localStorage for previously selected project first
      const lastProjectSlug = localStorage.getItem('mini-sentry-last-project')
      if (lastProjectSlug) {
        const lastProject = projects.find(p => p.slug === lastProjectSlug)
        if (lastProject) {
          setSelected(lastProject)
          setRange('24h')
          setInterval('1h')
          setTimeSel(null)
          setCustomRange(null)
          return
        }
      }
      // Fall back to first project if no last project or it doesn't exist
      setSelected(projects[0])
      // Set default time range for first project load
      setRange('24h')
      setInterval('1h')
      setTimeSel(null)
      setCustomRange(null)
    }
  }, [projects])

  // Push state to URL hash on changes
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('view', activeTab)
    if (selected) {
      params.set('project', selected.slug)
      // Save selected project to localStorage for persistence across page refreshes
      localStorage.setItem('mini-sentry-last-project', selected.slug)
    }
    if (search) params.set('q', search)
    if (filterLevel) params.set('level', filterLevel)
    if (filterEnv) params.set('env', filterEnv)
    if (filterRelease) params.set('release', filterRelease)
    if (timeSel) { params.set('from', timeSel.from); params.set('to', timeSel.to) }
    if (eventLimit) params.set('limit', String(eventLimit))
    if (eventOffset) params.set('offset', String(eventOffset))
    const newHash = '#' + params.toString()
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash)
    }
  }, [activeTab, selected, search, filterLevel, filterEnv, filterRelease, timeSel, eventLimit, eventOffset])

  // Auto-select first project when list loads
  useEffect(() => {
    if (!selected && projects.length > 0) setSelected(projects[0])
  }, [projects])

  useEffect(() => {
    if (!selected) return
    
    // Calculate time range - either from specific timeSel or from range/customRange
    let timeParams: {from: string; to: string} | null = null
    if (timeSel) {
      timeParams = timeSel
    } else if (customRange || range !== '24h' || range === '1h') {
      // Calculate time range based on custom range or preset range
      const now = Date.now()
      let minutes = 0
      
      if (customRange) {
        minutes = customRange.unit === 'm' ? customRange.value :
                 customRange.unit === 'h' ? customRange.value * 60 :
                 customRange.unit === 'd' ? customRange.value * 24 * 60 :
                 customRange.unit === 'w' ? customRange.value * 7 * 24 * 60 : 1440
      } else {
        minutes = range==='1h'?60:range==='24h'?1440:range==='7d'?10080:range==='14d'?20160:range==='30d'?43200:range==='90d'?129600:525600
      }
      
      timeParams = {
        from: new Date(now - minutes * 60 * 1000).toISOString(),
        to: new Date(now).toISOString()
      }
    }
    
    const gq = new URLSearchParams({ project: selected.slug })
    if (timeParams) { gq.set('from', timeParams.from); gq.set('to', timeParams.to) }
    api(`/api/groups/?${gq.toString()}`).then(d => setGroups(asList<Group>(d)))
    const q = new URLSearchParams({ project: selected.slug })
    if (filterLevel) q.set('level', filterLevel)
    if (filterEnv) q.set('environment', filterEnv)
    if (filterRelease) q.set('release', filterRelease)
    if (search) q.set('q', search)
    if (timeParams) { q.set('from', timeParams.from); q.set('to', timeParams.to) }
    // Only apply pagination when viewing Logs
    if (activeTab === 'logs') {
      q.set('limit', String(eventLimit))
      q.set('offset', String(eventOffset))
    }
    api(`/api/events/?${q.toString()}`).then((d) => {
      if (Array.isArray(d)) {
        setEvents(d)
        setEventTotal(d.length)
      } else if (d && d.results) {
        setEvents(d.results)
        setEventTotal(d.count || 0)
      } else {
        setEvents([])
        setEventTotal(0)
      }
    }).catch(() => {})
    api(`/api/releases/?project=${selected.slug}`).then(d => setReleases(asList<Release>(d))).catch(() => {})
    api(`/api/alert-rules/?project=${selected.slug}`).then(d => setRules(asList<AlertRule>(d))).catch(() => {})
    api(`/api/releases/health/?project=${selected.slug}`).then(setHealth).catch(() => {})
    api(`/api/deployments/?project=${selected.slug}`).then(d => setDeploys(asList<Deployment>(d))).catch(() => {})
    api(`/api/releases/health/series/?project=${selected.slug}&range=${range}&interval=${interval}`).then(setSeries).catch(() => {})
  }, [selected, filterLevel, filterEnv, filterRelease, search, timeSel, eventLimit, eventOffset, activeTab, customRange, range])

  // Reset pagination when filters or search change
  useEffect(() => { setEventOffset(0) }, [selected, filterLevel, filterEnv, filterRelease, search, timeSel, customRange, range])

  const createProject = async (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const created = await api('/api/projects/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })
    reload()
    if (created && created.id) setSelected(created)
  }

  const sendEvent = async () => {
    if (!selected) return
    await api(`/api/events/ingest/token/${selected.ingest_token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, level: 'error', ui: true, tags: [{source:'ui'}] }),
    })
    // refresh
    setTimeout(() => {
      api(`/api/groups/?project=${selected.slug}`).then(d => setGroups(asList<Group>(d)))
      api(`/api/events/?project=${selected.slug}`).then(d => {
        if (Array.isArray(d)) setEvents(d)
        else if (d && d.results) setEvents(d.results)
        else setEvents([])
      }).catch(() => {})
    }, 500)
  }

  const createRelease = async (version: string, environment: string) => {
    if (!selected) return
    await api('/api/releases/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: selected.id, version, environment }),
    })
    api(`/api/releases/?project=${selected.slug}`).then(d => setReleases(asList<Release>(d)))
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
    api(`/api/deployments/?project=${selected.slug}`).then(d => setDeploys(asList<Deployment>(d)))
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
    api(`/api/alert-rules/?project=${selected.slug}`).then(d => setRules(asList<AlertRule>(d)))
  }

  const fetchEvent = async (id: number) => {
    const d = await api(`/api/events/${id}/`)
    // Track symbolication source
    let symSource: 'stored'|'live'|undefined
    if (d.symbolicated?.frames?.length) symSource = 'stored'
    // Try live symbolication if stored frames are missing but we have a stack + release
    if ((!d.symbolicated || !d.symbolicated.frames || d.symbolicated.frames.length === 0) && d.stack && d.release && selected) {
      const relObj = releases.find(r => r.id === d.release)
      if (relObj) {
        try {
          const sym = await api(`/api/symbolicate/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project: selected.slug,
              release: relObj.version,
              environment: relObj.environment,
              stack: d.stack,
            })
          })
          d.symbolicated = { frames: sym.frames }
          symSource = 'live'
        } catch {}
      }
    }
    if (symSource) (d as any)._symSource = symSource
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="w-full px-6 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Mini Sentry UI</h1>
        <div className="grid grid-cols-[56px_1fr] gap-6">
          <NavRail active={activeTab} onChange={setActiveTab} />
          <main className="min-w-0 flex-1">
            <div className="space-y-4">
              {activeTab === 'projects' ? (
                <ProjectsTab
                  projects={projects}
                  selected={selected || projects[0]}
                  setSelected={setSelected}
                  onCreate={createProject}
                />
              ) : activeTab === 'dashboard' ? (
                selected ? <Dashboard projectSlug={selected.slug} fromTo={timeSel || undefined} /> : <p className="text-sm text-slate-400">Create or select a project in Projects tab.</p>
              ) : activeTab === 'logs' ? (
                selected ? (
                  <LogsView
                    selected={selected}
                    projects={projects}
                    setSelected={setSelected}
                    search={search}
                    setSearch={setSearch}
                    filterLevel={filterLevel}
                    setFilterLevel={setFilterLevel}
                    filterEnv={filterEnv}
                    setFilterEnv={setFilterEnv}
                    filterRelease={filterRelease}
                    setFilterRelease={setFilterRelease}
                    events={events}
                    onView={fetchEvent}
                    eventDetails={eventDetails}
                    range={range}
                    interval={interval}
                    setRange={setRange}
                    setInterval={setInterval}
                    onSendTest={() => sendEvent()}
                    msg={msg}
                    setMsg={setMsg}
                    timeSel={timeSel}
                    setTimeSel={setTimeSel}
                    eventLimit={eventLimit}
                    setEventLimit={setEventLimit}
                    eventOffset={eventOffset}
                    setEventOffset={setEventOffset}
                    eventTotal={eventTotal}
                    customRange={customRange}
                    setCustomRange={setCustomRange}
                  />
                ) : <p className="text-sm text-slate-400">Create or select a project in Projects tab.</p>
              ) : (
                selected ? (
                  <OverviewPage
                    selected={selected}
                    releases={releases}
                    createRelease={createRelease}
                    deploys={deploys}
                    createDeployment={createDeployment}
                    sessionUser={sessionUser}
                    setSessionUser={setSessionUser}
                    sendSession={sendSession}
                    range={range}
                    setRange={setRange}
                    interval={interval}
                    setInterval={setInterval}
                    refreshSeries={refreshSeries}
                    series={series}
                    health={health}
                    rules={rules}
                    createRule={createRule}
                    editRule={editRule}
                    setEditRule={setEditRule}
                    updateFirstRule={updateFirstRule}
                    groups={groups}
                    setGroups={setGroups}
                    snoozeGroup={snoozeGroup}
                  />
                ) : <p className="text-sm text-slate-400" data-testid="overview-no-project">Create or select a project in Projects tab.</p>) }
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function levelDot(level: string) {
  const color = level === 'error' ? 'bg-red-500' : level === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`}></span>
}



function parseTokens(q: string) {
  const tokens: Array<{key?: string; value: string; raw: string}> = []
  const re = /(\w+):"([^"]+)"|(\w+):(\S+)|"([^"]+)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(q)) !== null) {
    if (m[1] && m[2]) tokens.push({ key: m[1], value: m[2], raw: m[0] })
    else if (m[3] && m[4]) tokens.push({ key: m[3], value: m[4], raw: m[0] })
    else if (m[5]) tokens.push({ value: m[5], raw: m[0] })
    else if (m[6]) tokens.push({ value: m[6], raw: m[0] })
  }
  return tokens
}

function removeTokenFromQuery(q: string, raw: string) {
  return q.replace(raw, '').replace(/\s+/g, ' ').trim()
}

function LogsView({
  selected,
  projects,
  setSelected,
  search, setSearch,
  filterLevel, setFilterLevel,
  filterEnv, setFilterEnv,
  filterRelease, setFilterRelease,
  events,
  onView,
  eventDetails,
  range, interval, setRange, setInterval,
  onSendTest,
  msg, setMsg,
  timeSel, setTimeSel,
  eventLimit, setEventLimit,
  eventOffset, setEventOffset,
  eventTotal,
  customRange,
  setCustomRange,
}: {
  selected: Project
  projects: Project[]
  setSelected: (p: Project) => void
  search: string
  setSearch: (s: string) => void
  filterLevel: string
  setFilterLevel: (s: string) => void
  filterEnv: string
  setFilterEnv: (s: string) => void
  filterRelease: string
  setFilterRelease: (s: string) => void
  events: Event[]
  onView: (id: number) => void
  eventDetails: Record<number, any>
  range: '1h'|'24h'|'7d'|'14d'|'30d'|'90d'|'1y'
  interval: '1m'|'5m'|'15m'|'30m'|'1h'|'24h'|'7d'|'30d'
  setRange: (r: '1h'|'24h'|'7d'|'14d'|'30d'|'90d'|'1y') => void
  setInterval: (i: '1m'|'5m'|'15m'|'30m'|'1h'|'24h'|'7d'|'30d') => void
  onSendTest: () => void
  msg: string
  setMsg: (s: string) => void
  timeSel: {from: string; to: string} | null
  setTimeSel: (v: {from: string; to: string} | null) => void
  eventLimit: number
  setEventLimit: (n: number) => void
  eventOffset: number
  setEventOffset: (n: number) => void
  eventTotal: number
  customRange: {value: number; unit: string; label: string} | null
  setCustomRange: (customRange: {value: number; unit: string; label: string} | null) => void
}) {
  const tokens = parseTokens(search)
  const [series, setSeries] = useState<any[]>([])
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const [hover, setHover] = useState<{i: number; x: number; y: number} | null>(null)
  const [drag, setDrag] = useState<{start: number; end?: number} | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [legendSel, setLegendSel] = useState<{[k:string]: boolean}>({ error: true, warning: true, info: true })
  const chartInstRef = React.useRef<any>(null)
  const [zoomStart, setZoomStart] = useState<number|null>(null)
  const [zoomEnd, setZoomEnd] = useState<number|null>(null)
  const brushTimer = React.useRef<any>(null)
  const isUpdatingFromCode = React.useRef<boolean>(false)
  useEffect(() => () => { if (brushTimer.current) clearTimeout(brushTimer.current) }, [])

  // Keep chart zoom in sync with selected time range (from brush, click, or quick menu)
  useEffect(() => {
    const inst = chartInstRef.current
    if (!inst || isUpdatingFromCode.current) return
    
    // Check if instance is disposed before using it
    try {
      const option = inst.getOption()
      if (!option) return // Instance is disposed
    } catch {
      return // Instance is disposed or invalid
    }
    
    // Add a small delay to avoid interfering with other effects
    const timer = setTimeout(() => {
      if (timeSel && timeSel.from && timeSel.to) {
        const fromVal = new Date(timeSel.from).getTime()
        const toVal = new Date(timeSel.to).getTime()
        setZoomStart(fromVal); setZoomEnd(toVal)
        isUpdatingFromCode.current = true
        try { 
          if (!inst.isDisposed?.()) {
            inst.dispatchAction({ type: 'dataZoom', startValue: fromVal, endValue: toVal }) 
          }
        } catch {}
        setTimeout(() => { isUpdatingFromCode.current = false }, 200)
      } else {
        setZoomStart(null); setZoomEnd(null)
        isUpdatingFromCode.current = true
        try { 
          if (!inst.isDisposed?.()) {
            inst.dispatchAction({ type: 'dataZoom', start: 0, end: 100 }) 
          }
        } catch {}
        setTimeout(() => { isUpdatingFromCode.current = false }, 200)
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [timeSel])
  const bucketMs = interval === '1h' ? 60*60*1000 : 5*60*1000

  function normISO(s: string) {
    if (!s) return s
    if (s.endsWith('Z') || /[+-]\d\d:?\d\d$/.test(s)) return s.replace(' ', 'T')
    return s.replace(' ', 'T') + 'Z'
  }

  function toInputLocal(iso?: string) {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const [fromLocal, setFromLocal] = useState('')
  const [toLocal, setToLocal] = useState('')
  useEffect(() => {
    setFromLocal(timeSel ? toInputLocal(timeSel.from) : '')
    setToLocal(timeSel ? toInputLocal(timeSel.to) : '')
  }, [timeSel])
  useEffect(() => {
    const ib = (i: string) => (i==='5m'||i==='1h')? i : (i==='1m'?'5m':(i==='15m'?'5m':(i==='30m'?'1h':'1h')))
    fetch(`/api/dashboard/series/?project=${selected.slug}&range=${range}&interval=${ib(interval)}&backend=ch`).then(r=>r.json()).then(setSeries).catch(()=>{})
  }, [selected.slug, range, interval])

  const height = 160, pad = 24
  const chartHostRef = React.useRef<HTMLDivElement>(null)
  const [chartW, setChartW] = useState(800)
  useEffect(() => {
    const measure = () => setChartW(chartHostRef.current?.clientWidth || 800)
    measure()
    const RO = (window as any).ResizeObserver as any
    let ro: any = null
    if (RO) {
      ro = new RO(measure)
      if (chartHostRef.current) ro.observe(chartHostRef.current)
    }
    return () => { try { ro && ro.disconnect && ro.disconnect() } catch {} }
  }, [])
  const totals = series.map((r: any) => ({ bucket: r.bucket, error: r.error||0, warning: r.warning||0, info: r.info||0, count: (r.error||0)+(r.warning||0)+(r.info||0) }))
  
  // Memoize chart data to prevent flickering when unrelated state changes
  const chartData = React.useMemo(() => {
    return totals.map(r => ({
      bucket: r.bucket,
      error: r.error,
      warning: r.warning, 
      info: r.info,
      timestamp: new Date(normISO(r.bucket)).getTime()
    }))
  }, [totals])
  
  const maxSum = Math.max(1, ...totals.map(r => r.count))
  function niceTicks(max: number, n = 5): number[] {
    if (max <= 5) return Array.from({length: max+1}, (_, i) => i)
    const step10 = Math.pow(10, Math.floor(Math.log10(max / n)))
    const err = n / (max / step10)
    const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1
    const niceStep = Math.max(1, Math.round(step10 * mult))
    const ticks: number[] = []
    for (let v = 0; v <= max; v += niceStep) ticks.push(v)
    if (ticks[ticks.length-1] !== max) ticks.push(max)
    return ticks
  }
  const yTicks = niceTicks(maxSum)
  // choose up to 6 x ticks based on width
  const step = totals.length > 0 ? (chartW - pad*2) / totals.length : (chartW - pad*2)
  const xTickCount = Math.min(6, Math.max(2, Math.floor((chartW - pad*2) / 160)))
  const xTicks = totals.length > 1 ? Array.from({ length: xTickCount }, (_, i) => Math.floor(i * (totals.length - 1) / (xTickCount - 1))) : [0]

  const visibleEvents = events.filter(e => legendSel[e.level ?? 'error'] !== false)

  function indexFromClientX(clientX: number, svgEl: SVGSVGElement | null) {
    if (!svgEl) return -1
    const rect = svgEl.getBoundingClientRect()
    const x = (clientX - rect.left) * (chartW / rect.width)
    if (totals.length === 0) return -1
    const idx = Math.max(0, Math.min(totals.length - 1, Math.floor((x - pad) / step)))
    return idx
  }

  return (
    <>
      <div className="rounded-xl border border-slate-800/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <select value={selected.id} onChange={(e)=>{ const p = projects.find(pp=>pp.id === Number(e.target.value)); if(p) { setSelected(p); setRange('24h'); setInterval('1h'); setTimeSel(null); setCustomRange(null) } }} className="rounded border border-slate-700 bg-transparent px-2 py-1">
              {projects.map(p => (<option key={p.id} value={p.id}>{p.slug}</option>))}
            </select>
            <select value={filterEnv} onChange={e=>setFilterEnv(e.target.value)} className="rounded border border-slate-700 bg-transparent px-2 py-1">
              <option value="">All Envs</option>
              <option value="production">production</option>
              <option value="staging">staging</option>
              <option value="development">development</option>
            </select>
            <TimeRangeMenu range={range} setRange={setRange} setInterval={setInterval} setTimeSel={setTimeSel} onCustomRange={setCustomRange} />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search for logs, users, tags, and more" className="w-full rounded border border-slate-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <StatusSummary projectSlug={selected.slug} />
          <div className="flex items-center gap-2">
            <input value={msg} onChange={e => setMsg(e.target.value)} className="w-48 rounded border border-slate-700 bg-transparent px-2 py-1 text-sm" />
            <button onClick={onSendTest} className="rounded border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800/60">Send test event</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={filterLevel} onChange={e=>setFilterLevel(e.target.value)} className="rounded-full border border-slate-700 bg-transparent px-3 py-1 text-xs">
            <option value="">severity:any</option>
            <option value="error">severity:error</option>
            <option value="warning">severity:warning</option>
            <option value="info">severity:info</option>
          </select>
          {timeSel && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs">
              time: {new Date(timeSel.from).toLocaleString()} – {new Date(timeSel.to).toLocaleString()}
              <button className="text-slate-400 hover:text-slate-200" onClick={()=>setTimeSel(null)}>×</button>
            </span>
          )}
          {tokens.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs">
              {t.key ? `${t.key}:` : ''}{t.value}
              <button className="text-slate-400 hover:text-slate-200" onClick={()=>setSearch(removeTokenFromQuery(search, t.raw))}>×</button>
            </span>
          ))}
          <button className="rounded-full border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800/60" onClick={() => { setTimeSel(null); setRange('24h'); setInterval('1h'); setCustomRange(null); setLegendSel({ error: true, warning: true, info: true }); try { const inst = chartInstRef.current; if (inst && !inst.isDisposed?.()) { inst.dispatchAction({ type: 'dataZoom', start: 0, end: 100 }) } } catch {} }}>See full list</button>
        </div>
        {showHelp && (
          <div className="mt-2 rounded border border-slate-800/60 bg-slate-900/50 p-3 text-xs text-slate-300">
            <div className="mb-1 font-semibold">Search tokens</div>
            <div>Events: level:&lt;error|warning|info&gt;, env:&lt;name&gt;, release:&lt;version&gt;, message:&lt;text&gt;, bare words → message</div>
            <div>Groups: status:&lt;open|resolved|ignored&gt;, assignee:&lt;user&gt;, title:&quot;quoted phrase&quot;</div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800/60 p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>count(logs)</span>
          <span className="text-slate-300">
            {(() => {
              const now = new Date()
              const end = timeSel ? new Date(timeSel.to) : now
              const minutes = customRange ? 
                (customRange.unit === 'm' ? customRange.value :
                 customRange.unit === 'h' ? customRange.value * 60 :
                 customRange.unit === 'd' ? customRange.value * 24 * 60 :
                 customRange.unit === 'w' ? customRange.value * 7 * 24 * 60 : 1440)
                : (range==='1h'?60:range==='24h'?1440:range==='7d'?10080:range==='14d'?20160:range==='30d'?43200:range==='90d'?129600:525600)
              const start = timeSel ? new Date(timeSel.from) : new Date(now.getTime() - minutes*60*1000)
              const fmtOpts: any = { year: 'numeric', month: 'short', day: '2-digit' }
              return `${start.toLocaleDateString(undefined, fmtOpts)} — ${end.toLocaleDateString(undefined, fmtOpts)}`
            })()}
          </span>
        </div>
        <div className="w-full">
          <div style={{ width: '100%', height: 220 }}>
            { /* @ts-ignore */ }
            <ReactECharts
              key={`chart-${selected.slug}-${range}-${customRange?.label || ''}`}
              echarts={echarts as any}
              style={{ width: '100%', height: 220, cursor: 'crosshair' }}
              option={{
                legend: { data: ['error','warning','info'], textStyle: { color: '#cbd5e1' }, top: 0, selected: legendSel },
                grid: { left: 40, right: 16, top: 26, bottom: 40 },
                tooltip: {
                  trigger: 'axis',
                  axisPointer: { type: 'shadow' },
                  formatter: (params: any[]) => {
                    if (!params?.length) return ''
                    const t = new Date(params[0].value[0])
                    const lines = [fmtDate(t.toISOString())]
                    let total = 0
                    params.forEach(p => { total += p.value[1] })
                    lines.push(`total: ${total}`)
                    params.forEach(p => lines.push(`${p.seriesName}: ${p.value[1]}`))
                    return lines.join('<br/>')
                  }
                },
                xAxis: { 
                  type: 'time', 
                  axisLabel: { color: '#94a3b8' }, 
                  axisLine: { lineStyle: { color: '#64748b' } },
                  // Set explicit bounds based on selected range when no specific timeSel
                  ...(timeSel ? {} : {
                    min: new Date(Date.now() - (customRange ? 
                      (customRange.unit === 'm' ? customRange.value * 60 * 1000 :
                       customRange.unit === 'h' ? customRange.value * 60 * 60 * 1000 :
                       customRange.unit === 'd' ? customRange.value * 24 * 60 * 60 * 1000 :
                       customRange.unit === 'w' ? customRange.value * 7 * 24 * 60 * 60 * 1000 : 86400000)
                      : (range==='1h'?60:range==='24h'?1440:range==='7d'?10080:range==='14d'?20160:range==='30d'?43200:range==='90d'?129600:525600) * 60 * 1000)).getTime(),
                    max: new Date().getTime()
                  })
                },
                yAxis: { type: 'value', min: 0, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#64748b', opacity: 0.25, type: 'dashed' } } },
                // wheel/pinch zoom inside; no slider UI (persist selected range)
                dataZoom: [ Object.assign({ type: 'inside', zoomOnMouseWheel: true, moveOnMouseWheel: false, moveOnMouseMove: false }, (zoomStart!=null&&zoomEnd!=null)?{ startValue: zoomStart, endValue: zoomEnd }:{ start: 0, end: 100 } ) ],
                // enable drag-to-select across x axis (like Sentry)
                brush: { xAxisIndex: 0, brushType: 'lineX', brushMode: 'single', transformable: false, throttleType: 'debounce', throttleDelay: 120 },
                series: [
                  { name:'error', type:'bar', stack:'total', barMaxWidth: 28, itemStyle:{ color:'#ef4444' }, data: chartData.map(r=>[r.timestamp, r.error]) },
                  { name:'warning', type:'bar', stack:'total', barMaxWidth: 28, itemStyle:{ color:'#f59e0b' }, data: chartData.map(r=>[r.timestamp, r.warning]) },
                  { name:'info', type:'bar', stack:'total', barMaxWidth: 28, itemStyle:{ color:'#60a5fa' }, data: chartData.map(r=>[r.timestamp, r.info]) },
                ],
              }}
              onChartReady={(inst: any) => {
                // Activate brush cursor globally without toolbox
                try {
                  chartInstRef.current = inst
                  inst.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: 'lineX', brushMode: 'single' } })
                } catch {}
              }}
              onEvents={{
                click: (p: any) => {
                  // Don't process click events triggered by our own code
                  if (isUpdatingFromCode.current) return
                  
                  // Clicking a bar filters to that bucket's time window
                  const pt = Array.isArray(p?.data) ? p.data[0] : null
                  if (pt != null) {
                    const fromISO = new Date(pt).toISOString()
                    const toISO = new Date(pt + bucketMs - 1).toISOString()
                    setTimeSel({ from: fromISO, to: toISO })
                    try {
                      setZoomStart(pt); setZoomEnd(pt + bucketMs - 1)
                      isUpdatingFromCode.current = true
                      const inst = chartInstRef.current
                      if (inst && !inst.isDisposed?.()) {
                        inst.dispatchAction({ type: 'dataZoom', startValue: pt, endValue: pt + bucketMs - 1 })
                      }
                      setTimeout(() => { isUpdatingFromCode.current = false }, 200)
                    } catch {}
                  }
                },
                datazoom: (e: any) => {
                  // Don't process zoom events triggered by our own code
                  if (isUpdatingFromCode.current) return
                  
                  const sv = (e as any).startValue
                  const ev = (e as any).endValue
                  if (sv != null && ev != null) {
                    const fromISO = new Date(sv).toISOString()
                    const toISO = new Date(ev + bucketMs - 1).toISOString()
                    setTimeSel({ from: fromISO, to: toISO })
                    setZoomStart(sv); setZoomEnd(ev)
                  } else if (e.start != null && totals.length > 1) {
                    const si = Math.max(0, Math.round(e.start / 100 * (totals.length - 1)))
                    const ei = Math.max(si, Math.round(e.end / 100 * (totals.length - 1)))
                    const fromISO = normISO(totals[si].bucket)
                    const toISO = new Date(new Date(normISO(totals[ei].bucket)).getTime() + bucketMs - 1).toISOString()
                    setTimeSel({ from: fromISO, to: toISO })
                    const fromVal = new Date(normISO(totals[si].bucket)).getTime()
                    const toVal = new Date(normISO(totals[ei].bucket)).getTime()
                    setZoomStart(fromVal); setZoomEnd(toVal)
                  }
                },
                brush: (e: any) => {
                  // This fires during brushing - don't apply filter yet, just for visual feedback
                  if (isUpdatingFromCode.current) return
                },
                brushEnd: (e: any) => {
                  // This fires when brush is released - now we apply the filter
                  if (isUpdatingFromCode.current) return
                  
                  const batch = e?.areas?.[0]
                  if (batch && batch.coordRange && batch.coordRange.length === 2) {
                    const fromVal = batch.coordRange[0]
                    const toVal = batch.coordRange[1]
                    
                    // Clear any existing timer
                    if (brushTimer.current) clearTimeout(brushTimer.current)
                    
                    // Apply the filter immediately when brush ends
                    const fromISO = new Date(fromVal).toISOString()
                    const toISO = new Date(toVal + bucketMs - 1).toISOString()
                    
                    
                    setTimeSel({ from: fromISO, to: toISO })
                    try {
                      setZoomStart(fromVal); setZoomEnd(toVal)
                      isUpdatingFromCode.current = true
                      const inst = chartInstRef.current
                      if (inst && !inst.isDisposed?.()) {
                        inst.dispatchAction({ type: 'dataZoom', startValue: fromVal, endValue: toVal })
                        inst.dispatchAction({ type: 'brush', areas: [] })
                      }
                      setTimeout(() => { isUpdatingFromCode.current = false }, 200)
                    } catch {}
                  }
                },
                legendselectchanged: (e: any) => {
                  const sel = e?.selected || {}
                  setLegendSel(sel)
                  // Sync to server filter if exactly one level is selected
                  const active = Object.keys(sel).filter(k => sel[k])
                  if (active.length === 1) setFilterLevel(active[0])
                  else setFilterLevel('')
                }
              }}
            />
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-400">Tip: Use the chart zoom to filter time range (logs and dashboard sync).</div>
      </div>


      <div className="rounded-xl border border-slate-800/60">
        <div className="grid grid-cols-[220px_1fr_120px] gap-2 border-b border-slate-800/60 px-3 py-2 text-xs text-slate-400">
          <div>TIMESTAMP</div>
          <div>MESSAGE</div>
          <div>LEVEL</div>
        </div>
        <div className="divide-y divide-slate-800/60">
          {visibleEvents.map(e => (
            <div key={e.id} className="grid grid-cols-[220px_1fr_120px] items-start gap-2 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <button
                  className={`inline-flex h-5 w-5 items-center justify-center rounded hover:bg-slate-800/60`}
                  title="Toggle details"
                  onClick={() => { const isOpen = !!open[e.id]; const next = {...open, [e.id]: !isOpen}; setOpen(next); if (!isOpen && !eventDetails[e.id]) onView(e.id) }}
                >
                  <svg viewBox="0 0 12 12" className={`h-3 w-3 transform transition-transform ${open[e.id] ? 'rotate-90' : ''}`} aria-hidden="true">
                    <path d="M4 2 L8 6 L4 10 Z" fill="currentColor" />
                  </svg>
                </button>
                {levelDot(e.level)}
                <span className="tabular-nums text-slate-300">{fmtDate(e.received_at)}</span>
              </div>
              <div className="min-w-0 truncate text-slate-100">{e.message}</div>
              <div className="flex items-center"><LevelBadge level={e.level} /></div>
              {open[e.id] && (
              <div className="col-span-3">
                {eventDetails[e.id] ? (
                  <div className="mt-2 rounded-xl border border-slate-700 bg-slate-800/40 p-4 shadow-sm ring-1 ring-slate-700/40 border-l-4 border-indigo-500/60">
                    <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
                      <div className="truncate pr-2 text-sm font-medium text-slate-100">{e.message}</div>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="rounded bg-slate-900/60 px-2 py-0.5">{fmtDate(e.received_at)}</span>
                        <LevelBadge level={e.level} />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          {eventDetails[e.id].release ? (
                            <>
                              <dt className="text-slate-400">release</dt>
                              <dd className="truncate">{eventDetails[e.id].release}</dd>
                            </>
                          ) : null}
                          {eventDetails[e.id].environment ? (
                            <>
                              <dt className="text-slate-400">environment</dt>
                              <dd>{eventDetails[e.id].environment}</dd>
                            </>
                          ) : null}
                          <dt className="text-slate-400">timestamp</dt>
                          <dd className="truncate">{fmtDate(e.received_at)}</dd>
                          {Array.isArray(eventDetails[e.id].tags) && eventDetails[e.id].tags.length ? (
                            <>
                              <dt className="text-slate-400">tags</dt>
                              <dd className="truncate">{eventDetails[e.id].tags.map((t: any) => (t.key?`${t.key}:${t.value}`:typeof t==='string'?t:JSON.stringify(t))).join(', ')}</dd>
                            </>
                          ) : null}
                          {eventDetails[e.id].payload && typeof eventDetails[e.id].payload === 'object' ? (
                            Object.entries(eventDetails[e.id].payload).slice(0,8).map(([k,v]: any, idx: number) => (
                              <React.Fragment key={idx}>
                                <dt className="text-slate-400">{k}</dt>
                                <dd className="truncate">{typeof v === 'string' ? v : JSON.stringify(v)}</dd>
                              </React.Fragment>
                            ))
                          ) : null}
                        </dl>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-400">stack</div>
                          { (eventDetails[e.id] as any)._symSource ? (
                            <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-300">symbolicated: {(eventDetails[e.id] as any)._symSource}</span>
                          ) : null }
                        </div>
                        {eventDetails[e.id].symbolicated?.frames?.length ? (
                          <ol className="space-y-1 text-xs">
                            {eventDetails[e.id].symbolicated.frames.map((fr: any, i: number) => (
                              <li key={i} className="truncate">
                                at <span className="text-slate-200">{fr.function || '<anon>'}</span> (<span className="text-slate-300">{fr.orig_file || fr.file}:{fr.orig_line || fr.line}:{(fr.orig_column ?? fr.column) || 0}</span>)
                              </li>
                            ))}
                          </ol>
                        ) : eventDetails[e.id].stack ? (
                          <pre className="max-h-56 overflow-auto rounded bg-slate-900/70 p-2 text-xs">{eventDetails[e.id].stack}</pre>
                        ) : (
                          <div className="text-xs text-slate-400">No stack</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-400">Loading details…</div>
                )}
              </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-800/60 px-3 py-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select className="rounded border border-slate-700 bg-transparent px-2 py-1" value={eventLimit} onChange={e=>{ setEventLimit(parseInt(e.target.value) || 50); setEventOffset(0); }}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span>
              {eventTotal ? `${Math.min(eventTotal, eventOffset+1)}–${Math.min(eventTotal, eventOffset + events.length)} of ${eventTotal}` : `${events.length} rows`}
            </span>
            <button className="rounded border border-slate-700 px-2 py-1 disabled:opacity-50" disabled={eventOffset<=0} onClick={()=> setEventOffset(Math.max(0, eventOffset - eventLimit))}>
              Prev
            </button>
            <button className="rounded border border-slate-700 px-2 py-1 disabled:opacity-50" disabled={eventOffset + events.length >= eventTotal} onClick={()=> setEventOffset(eventOffset + eventLimit)}>
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  )
}


function StatusSummary({ projectSlug }: { projectSlug: string }) {
  const [counts, setCounts] = useState<{releases: number; artifacts: number}>({ releases: 0, artifacts: 0 })
  useEffect(() => {
    let stop = false
    ;(async () => {
      try {
        const rels = await api(`/api/releases/?project=${projectSlug}`)
        if (stop) return
        const lists = await Promise.all(
          (rels || []).map((r: any) => fetch(`/api/releases/${r.id}/artifacts/`).then(res => res.ok ? res.json() : []).catch(() => []))
        )
        const totalArtifacts = lists.reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0)
        if (!stop) setCounts({ releases: (rels || []).length, artifacts: totalArtifacts })
      } catch {
        if (!stop) setCounts({ releases: 0, artifacts: 0 })
      }
    })()
    return () => { stop = true }
  }, [projectSlug])
  return (
    <div className="hidden items-center gap-2 text-xs text-slate-300 md:flex">
      <span className="rounded bg-slate-800/60 px-2 py-1">releases {counts.releases}</span>
      <span className="rounded bg-slate-800/60 px-2 py-1">artifacts {counts.artifacts}</span>
    </div>
  )
}







function ProjectsTab({ projects, selected, setSelected, onCreate }: { projects: Project[]; selected?: Project | null; setSelected: (p: Project)=>void; onCreate: (name: string)=>void }) {
  const [name, setName] = useState('My App')
  return (
    <section className="rounded-xl border border-slate-800/60 p-4">
      <h4 className="mb-3 text-sm font-semibold">Projects</h4>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className="rounded border border-slate-700 bg-transparent px-2 py-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Project name" />
        <button className="rounded border border-slate-700 px-3 py-1.5 hover:bg-slate-800/60" onClick={()=>onCreate(name)}>Create Project</button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-slate-400"><tr><th>Slug</th><th>Name</th><th>Token</th><th>Actions</th></tr></thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.id} className={`border-t border-slate-800/60 ${selected && selected.id===p.id?'bg-slate-800/30':''}`}>
              <td className="py-1.5">{p.slug}</td>
              <td>{p.name}</td>
              <td className="truncate"><code>{p.ingest_token}</code></td>
              <td>
                <button className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800/60" onClick={()=>setSelected(p)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
