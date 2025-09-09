import React, { useEffect, useState } from 'react'
import { Dashboard } from './Dashboard'
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

function LevelBadge({ level }: { level: string }) {
  const colors = {
    error: 'bg-red-500/20 text-red-300 border-red-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    info: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  };
  
  const colorClass = colors[level as keyof typeof colors] || colors.info;
  
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${colorClass}`}>
      <span className={`h-2 w-2 rounded-full ${level === 'error' ? 'bg-red-500' : level === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} />
      {level}
    </span>
  );
}

function TimeRangeMenu({ range, setRange, setInterval, setTimeSel, onCustomRange }: { range: '1h'|'24h'|'7d'|'14d'|'30d'|'90d'|'1y', setRange: any, setInterval: any, setTimeSel: any, onCustomRange?: (customRange: {value: number; unit: string; label: string} | null) => void }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [customRange, setCustomRange] = useState<{value: number; unit: string; label: string} | null>(null)
  const applyRelative = (r: string) => {
    setRange(r)
    setInterval(r==='1h'?'1m':r==='24h'?'1h':r==='7d'?'1h':r==='14d'?'1h':r==='30d'?'24h':r==='90d'?'24h':'24h')
    setTimeSel(null) // Clear any specific time selection - show full range
    setCustomRange(null) // Clear custom range when using preset
    onCustomRange?.(null) // Notify parent
    setOpen(false)
  }
  // Parse custom input and return the best match without applying it
  const parseCustomInput = (s: string): {value: number; unit: string; label: string} | null => {
    let maxMs = 0
    let bestMatch: {value: number; unit: string; label: string} | null = null
    
    s.split(/[\,\s]+/).forEach(tok => {
      const m = tok.trim().match(/^(\d+)([mhdw])$/i)
      if (!m) return
      const value = parseInt(m[1], 10)
      const unit = m[2].toLowerCase()
      
      // Convert to milliseconds and validate limits
      let ms = 0
      let validRange = false
      let displayUnit = ''
      let pluralUnit = ''
      
      if (unit === 'm' && value <= 60) {
        ms = value * 60 * 1000
        validRange = true
        displayUnit = 'minute'
        pluralUnit = 'minutes'
      } else if (unit === 'h' && value <= 24) {
        ms = value * 60 * 60 * 1000
        validRange = true
        displayUnit = 'hour'
        pluralUnit = 'hours'
      } else if (unit === 'd' && value <= 365) {
        ms = value * 24 * 60 * 60 * 1000
        validRange = true
        displayUnit = 'day'
        pluralUnit = 'days'
      } else if (unit === 'w' && value <= 52) {
        ms = value * 7 * 24 * 60 * 60 * 1000
        validRange = true
        displayUnit = 'week'
        pluralUnit = 'weeks'
      }
      
      if (validRange && ms > maxMs) {
        maxMs = ms
        const label = value === 1 ? `Last ${displayUnit}` : `Last ${value} ${pluralUnit}`
        bestMatch = { value, unit, label }
      }
    })
    
    return bestMatch
  }

  // Apply the custom range
  const applyCustomRange = (customRange: {value: number; unit: string; label: string}) => {
    const value = customRange.value
    const unit = customRange.unit
    const ms = unit === 'm' ? value * 60 * 1000 :
               unit === 'h' ? value * 60 * 60 * 1000 :
               unit === 'd' ? value * 24 * 60 * 60 * 1000 :
               unit === 'w' ? value * 7 * 24 * 60 * 60 * 1000 : 0

    // Set appropriate interval based on time range
    const interval = ms <= 60*60*1000 ? '1m' :       // <= 1 hour: 1m
                   ms <= 24*60*60*1000 ? '1h' :      // <= 1 day: 1h  
                   '24h'                              // > 1 day: 24h
    
    setRange('24h') // Use 24h as base, but we'll override with custom display
    setInterval(interval)
    setCustomRange(customRange)
    onCustomRange?.(customRange) // Notify parent
    setTimeSel(null) // Clear any specific time selection - show full range
    setCustom('') // Clear the input field
    setOpen(false)
  }
  
  // Get the parsed custom range from current input
  const parsedCustom = custom.trim() ? parseCustomInput(custom) : null
  const label = customRange ? customRange.label : (range==='1h'?'1H':range==='24h'?'24H':range==='7d'?'7D':range==='14d'?'14D':range==='30d'?'30D':range==='90d'?'90D':'1Y')
  return (
    <div className="relative">
      <button className="rounded border border-slate-700 bg-transparent px-2 py-1" onClick={()=>setOpen(v=>!v)}>{label}</button>
      {open && (
        <div className="absolute z-10 mt-1 w-56 rounded-md border border-slate-700 bg-slate-900 p-2 text-sm shadow">
          <div className="mb-2 text-[11px] text-slate-400">Filter Time Range</div>
          <input className="mb-2 w-full rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" placeholder="Custom range: 30m, 2h, 4d, 3w" value={custom} onChange={e=>setCustom(e.target.value)} />
          <ul className="space-y-1">
            {parsedCustom && (
              <li><button className="w-full rounded px-2 py-1 text-left bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30" onClick={()=>applyCustomRange(parsedCustom)}>{parsedCustom.label}</button></li>
            )}
            <li><button className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" onClick={()=>applyRelative('1h')}>Last hour</button></li>
            <li><button className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" onClick={()=>applyRelative('24h')}>Last 24 hours</button></li>
            <li><button className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" onClick={()=>applyRelative('7d')}>Last 7 days</button></li>
            <li><button className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" onClick={()=>applyRelative('14d')}>Last 14 days</button></li>
            <li><button className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" onClick={()=>applyRelative('30d')}>Last 30 days</button></li>
            <li><button className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" onClick={()=>{ /* Absolute date could open a date picker */ }}>Absolute date →</button></li>
          </ul>
        </div>
      )}
    </div>
  )
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

function NavRail({ active, onChange }: { active: 'logs'|'overview'|'dashboard'|'projects', onChange: (v: 'logs'|'overview'|'dashboard'|'projects') => void }) {
  const Icon = ({ children }: { children: React.ReactNode }) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  )
  const Home = () => (
    <Icon>
      <path d="M3 10.5L12 3l9 7.5V21a2 2 0 0 1-2 2h-5v-6H10v6H5a2 2 0 0 1-2-2V10.5z" />
      <path d="M3 10.5L12 3l9 7.5" />
    </Icon>
  )
  const Search = () => (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  )
  const Chart = () => (
    <Icon>
      <path d="M4 20V6" />
      <path d="M10 20V10" />
      <path d="M16 20V4" />
      <path d="M2 20h20" />
    </Icon>
  )
  const Folder = () => (
    <Icon>
      <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </Icon>
  )
  const Cog = () => (
    <Icon>
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
      <path d="M19.4 15a7.97 7.97 0 0 0 .1-2l2-1.2-2-3.5-2.3.6a8.06 8.06 0 0 0-1.7-1l-.3-2.4H11l-.3 2.4a8.06 8.06 0 0 0-1.7 1l-2.3-.6-2 3.5 2 1.2a7.97 7.97 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.6c.5.4 1.1.7 1.7 1l.3 2.4h3.8l.3-2.4c.6-.3 1.2-.6 1.7-1l2.3.6 2-3.5-2-1.2z" />
    </Icon>
  )
  const Item = ({ label, isActive, onClick, icon }: { label: string, isActive?: boolean, onClick?: () => void, icon: React.ReactNode }) => (
    <button title={label} onClick={onClick} className={`flex h-10 w-10 items-center justify-center rounded ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60'} `} aria-label={label}>
      <span className="text-slate-300">{icon}</span>
    </button>
  )
  return (
    <nav className="sticky top-4 flex h-[calc(100vh-2rem)] w-14 flex-col items-center gap-2 rounded-xl border border-slate-800/60 p-2">
      <div className="mb-2 mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold">MS</div>
      <Item label="Overview" isActive={active==='overview'} onClick={()=>onChange('overview')} icon={<Home />} />
      <Item label="Explore (Logs)" isActive={active==='logs'} onClick={()=>onChange('logs')} icon={<Search />} />
      <Item label="Dashboards" isActive={active==='dashboard'} onClick={()=>onChange('dashboard')} icon={<Chart />} />
      <Item label="Projects" isActive={active==='projects'} onClick={()=>onChange('projects')} icon={<Folder />} />
      <div className="mt-auto" />
      <Item label="Settings" icon={<Cog />} />
    </nav>
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
  
  const handleTargetTypeChange = (newType: 'email'|'webhook') => {
    setTargetType(newType)
    // Update default value when switching types
    setTargetValue(newType === 'email' ? 'alerts@example.test' : 'https://your-webhook-url.com/alerts')
  }
  
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Rule name" style={{ padding: 6, width: 180 }} />
      <input value={level} onChange={e => setLevel(e.target.value)} placeholder="Level (blank=any)" style={{ padding: 6, width: 140 }} />
      <input type="number" value={threshold} onChange={e => setThreshold(parseInt(e.target.value))} style={{ padding: 6, width: 100 }} />
      <select value={targetType} onChange={e => handleTargetTypeChange(e.target.value as any)} style={{ padding: 6 }} data-testid="alert-target-type-select">
        <option value="email">email</option>
        <option value="webhook">webhook</option>
      </select>
      <input 
        value={targetValue} 
        onChange={e => setTargetValue(e.target.value)} 
        placeholder={targetType === 'email' ? 'alerts@example.com' : 'https://webhook-url.com/alerts'} 
        style={{ padding: 6, width: 240 }} 
        data-testid="alert-target-input"
      />
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

function OverviewPage({
  selected,
  releases,
  createRelease,
  deploys,
  createDeployment,
  sessionUser,
  setSessionUser,
  sendSession,
  range,
  setRange,
  interval,
  setInterval,
  refreshSeries,
  series,
  health,
  rules,
  createRule,
  editRule,
  setEditRule,
  updateFirstRule,
  groups,
  setGroups,
  snoozeGroup,
}: {
  selected: Project
  releases: Release[]
  createRelease: (version: string, env: string) => void
  deploys: Deployment[]
  createDeployment: (name: string, url: string, env: string, releaseId?: number) => void
  sessionUser: string
  setSessionUser: (user: string) => void
  sendSession: (status: 'init'|'ok'|'errored'|'crashed'|'exited') => void
  range: '1h'|'24h'|'7d'|'30d'|'90d'|'1y'
  setRange: (r: '1h'|'24h'|'7d'|'14d'|'30d'|'90d'|'1y') => void
  interval: '1m'|'5m'|'15m'|'30m'|'1h'|'24h'|'7d'|'30d'
  setInterval: (i: '1m'|'5m'|'15m'|'30m'|'1h'|'24h'|'7d'|'30d') => void
  refreshSeries: () => void
  series: any[]
  health: any[]
  rules: AlertRule[]
  createRule: (name: string, level: string, threshold: number, targetType: 'email'|'webhook', targetValue: string) => void
  editRule: {threshold: number; window: number; notify: number}
  setEditRule: (rule: {threshold: number; window: number; notify: number}) => void
  updateFirstRule: () => void
  groups: Group[]
  setGroups: (groups: Group[]) => void
  snoozeGroup: (groupId: number, minutes?: number) => void
}) {
  const [assignModal, setAssignModal] = useState<{groupId: number, currentAssignee: string} | null>(null)
  const [commentModal, setCommentModal] = useState<{groupId: number} | null>(null)

  return (
    <div data-testid="overview-page" className="space-y-6">
      {/* Project Header */}
      <div data-testid="overview-header" className="rounded-xl border border-slate-800/60 bg-gradient-to-r from-slate-800/30 to-slate-700/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="project-title">{selected.name}</h1>
            <p className="text-slate-300" data-testid="project-description">
              Project management hub for releases, deployments, health monitoring, and issue management
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-4 py-2" data-testid="project-info">
            <div className="text-xs text-slate-400">Project Slug</div>
            <div className="font-mono text-sm text-slate-200">{selected.slug}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div data-testid="quick-actions" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center hover:bg-slate-800/40 transition-colors">
          <div className="text-2xl font-bold text-blue-400" data-testid="releases-count">{releases.length}</div>
          <div className="text-sm text-slate-300">Active Releases</div>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center hover:bg-slate-800/40 transition-colors">
          <div className="text-2xl font-bold text-green-400" data-testid="deployments-count">{deploys.length}</div>
          <div className="text-sm text-slate-300">Deployments</div>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center hover:bg-slate-800/40 transition-colors">
          <div className="text-2xl font-bold text-orange-400" data-testid="alert-rules-count">{rules.length}</div>
          <div className="text-sm text-slate-300">Alert Rules</div>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center hover:bg-slate-800/40 transition-colors">
          <div className="text-2xl font-bold text-red-400" data-testid="open-groups-count">{groups.length}</div>
          <div className="text-sm text-slate-300">Open Issues</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Release Management */}
        <section data-testid="releases-section" className="rounded-xl border border-slate-800/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Release Management</h3>
            <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
              {releases.length} releases
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Manage application versions, upload source maps, and track deployment artifacts.
          </p>
          <div data-testid="release-form">
            <ReleaseForm onCreate={createRelease} />
          </div>
          <div className="mt-4 max-h-64 overflow-y-auto" data-testid="releases-table">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr><th>Version</th><th>Env</th><th>Created</th><th>Artifact</th></tr>
              </thead>
              <tbody>
                {releases.map(r => (
                  <tr key={r.id} className="border-t border-slate-800/60" data-testid={`release-${r.id}`}>
                    <td className="py-2">{r.version}</td>
                    <td>{r.environment}</td>
                    <td>{r.created_at}</td>
                    <td><ArtifactForm releaseId={r.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Deployment Management */}
        <section data-testid="deployments-section" className="rounded-xl border border-slate-800/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Deployment Tracking</h3>
            <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300">
              {deploys.length} deployments
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Track application deployments across environments with URLs and timestamps.
          </p>
          <div data-testid="deployment-form">
            <DeploymentForm onCreate={createDeployment} />
          </div>
          <div className="mt-4 max-h-64 overflow-y-auto" data-testid="deployments-table">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr><th>Name</th><th>Env</th><th>Started</th><th>Finished</th><th>URL</th></tr>
              </thead>
              <tbody>
                {deploys.map(d => (
                  <tr key={d.id} className="border-t border-slate-800/60" data-testid={`deployment-${d.id}`}>
                    <td className="py-2">{d.name}</td>
                    <td>{d.environment}</td>
                    <td>{d.date_started}</td>
                    <td>{d.date_finished || ''}</td>
                    <td className="truncate max-w-32">{d.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Release Health */}
        <section data-testid="release-health-section" className="rounded-xl border border-slate-800/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Release Health</h3>
            <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
              Health monitoring
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Monitor application stability through session tracking and crash-free percentages.
          </p>
          
          {/* Session Testing */}
          <div className="mb-4 rounded border border-slate-700/50 bg-slate-800/30 p-3" data-testid="session-testing">
            <div className="mb-2 text-xs font-medium text-slate-300">Test Session Data</div>
            <div className="flex flex-wrap items-center gap-2">
              <input 
                data-testid="session-user-input"
                value={sessionUser} 
                onChange={e => setSessionUser(e.target.value)} 
                placeholder="user id" 
                className="rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
              />
              <button 
                data-testid="send-ok-session"
                className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                onClick={() => sendSession('ok')}
              >
                Send ok session
              </button>
              <button 
                data-testid="send-crashed-session"
                className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                onClick={() => sendSession('crashed')}
              >
                Send crashed session
              </button>
            </div>
          </div>

          {/* Health Data Controls */}
          <div className="mb-3 flex flex-wrap items-center gap-2" data-testid="health-controls">
            <label className="text-xs text-slate-400">Range</label>
            <select 
              data-testid="health-range-select"
              className="rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
              value={range} 
              onChange={e => setRange(e.target.value as any)}
            >
              <option value="1h">1h</option>
              <option value="24h">24h</option>
            </select>
            <label className="text-xs text-slate-400">Interval</label>
            <select 
              data-testid="health-interval-select"
              className="rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
              value={interval} 
              onChange={e => setInterval(e.target.value as any)}
            >
              <option value="5m">5m</option>
              <option value="1h">1h</option>
            </select>
            <button 
              data-testid="refresh-health"
              className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
              onClick={refreshSeries}
            >
              Refresh
            </button>
          </div>

          {/* Health Tables */}
          <div className="space-y-4">
            {series.length > 0 && (
              <div data-testid="health-series-table">
                <div className="text-xs font-medium text-slate-300 mb-2">Time Series Data</div>
                <div className="max-h-32 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-slate-400">
                      <tr><th>Bucket</th><th>Total</th><th>Crashed</th><th>Crash-free %</th></tr>
                    </thead>
                    <tbody>
                      {series.map((b, idx) => (
                        <tr key={idx} className="border-t border-slate-800/60">
                          <td className="py-1">{b.bucket}</td>
                          <td>{b.total}</td>
                          <td>{b.crashed}</td>
                          <td>{b.total === 0 ? 100 : Math.round(100 * (b.total - b.crashed) / b.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {health.length > 0 && (
              <div data-testid="health-summary-table">
                <div className="text-xs font-medium text-slate-300 mb-2">Release Health Summary</div>
                <div className="max-h-32 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-slate-400">
                      <tr><th>Version</th><th>Env</th><th>Total</th><th>Crashed</th><th>Crash-free %</th></tr>
                    </thead>
                    <tbody>
                      {health.map((h, idx) => (
                        <tr key={idx} className="border-t border-slate-800/60">
                          <td className="py-1">{h.version}</td>
                          <td>{h.environment}</td>
                          <td>{h.total_sessions}</td>
                          <td>{h.crashed_sessions}</td>
                          <td>{h.crash_free_rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Alert Rules */}
        <section data-testid="alert-rules-section" className="rounded-xl border border-slate-800/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Alert Management</h3>
            <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs text-orange-300">
              {rules.length} rules
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Configure automated alerts for error thresholds with email or webhook notifications.
          </p>
          
          <div data-testid="alert-rule-form">
            <AlertRuleForm onCreate={createRule} />
          </div>
          
          {rules.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="rounded border border-slate-700/50 bg-slate-800/30 p-3" data-testid="alert-rule-editor">
                <div className="mb-2 text-xs font-medium text-slate-300">Edit First Rule</div>
                <div className="flex items-center gap-2">
                  <input 
                    data-testid="rule-threshold-input"
                    type="number" 
                    value={editRule.threshold} 
                    onChange={e => setEditRule({...editRule, threshold: parseInt(e.target.value)})} 
                    placeholder="threshold" 
                    className="w-20 rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
                  />
                  <input 
                    data-testid="rule-window-input"
                    type="number" 
                    value={editRule.window} 
                    onChange={e => setEditRule({...editRule, window: parseInt(e.target.value)})} 
                    placeholder="window (min)" 
                    className="w-24 rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
                  />
                  <input 
                    data-testid="rule-notify-input"
                    type="number" 
                    value={editRule.notify} 
                    onChange={e => setEditRule({...editRule, notify: parseInt(e.target.value)})} 
                    placeholder="notify (min)" 
                    className="w-24 rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
                  />
                  <button 
                    data-testid="update-rule-button"
                    className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                    onClick={updateFirstRule}
                  >
                    Update
                  </button>
                </div>
              </div>
              
              <div data-testid="alert-targets-form">
                <AddTargetForm ruleId={rules[0].id} onAdded={() => api(`/api/alert-rules/?project=${selected!.slug}`).then(setRules)} />
              </div>
            </div>
          )}
          
          <div className="mt-4 max-h-40 overflow-y-auto" data-testid="alert-rules-table">
            <table className="w-full text-xs">
              <thead className="text-left text-slate-400">
                <tr><th>Name</th><th>Level</th><th>Threshold</th><th>Target</th></tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id} className="border-t border-slate-800/60" data-testid={`alert-rule-${r.id}`}>
                    <td className="py-1">{r.name}</td>
                    <td>{r.level || 'any'}</td>
                    <td>{r.threshold_count}</td>
                    <td className="truncate max-w-32">{r.target_type}: {r.target_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Issue Groups */}
      <section data-testid="groups-section" className="rounded-xl border border-slate-800/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Issue Management</h3>
          <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
            {groups.length} open issues
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Manage and triage error groups with resolve, ignore, assign, and comment actions.
        </p>
        
        <div className="overflow-x-auto" data-testid="groups-table">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr><th>Last Seen</th><th>Level</th><th>Title</th><th>Count</th><th>Status</th><th>Assignee</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id} className="border-t border-slate-800/60" data-testid={`group-${g.id}`}>
                  <td className="py-2">{g.last_seen}</td>
                  <td><LevelBadge level={g.level} /></td>
                  <td className="max-w-64 truncate">{g.title}</td>
                  <td>{g.count}</td>
                  <td className="text-xs">
                    {g.status === 'resolved' ? (
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full">resolved</span>
                    ) : g.status === 'ignored' ? (
                      <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">ignored</span>
                    ) : (
                      <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full">open</span>
                    )}
                  </td>
                  <td className="text-xs">
                    {g.assignee ? (
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">{g.assignee}</span>
                    ) : (
                      <span className="text-slate-500">unassigned</span>
                    )}
                  </td>
                  <td className="space-x-1">
                    <button 
                      data-testid={`resolve-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => api(`/api/groups/${g.id}/resolve/`, {method:'POST'}).then(()=>api(`/api/groups/?project=${selected!.slug}`).then(setGroups))}
                    >
                      Resolve
                    </button>
                    <button 
                      data-testid={`unresolve-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => api(`/api/groups/${g.id}/unresolve/`, {method:'POST'}).then(()=>api(`/api/groups/?project=${selected!.slug}`).then(setGroups))}
                    >
                      Unresolve
                    </button>
                    <button 
                      data-testid={`ignore-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => api(`/api/groups/${g.id}/ignore/`, {method:'POST'}).then(()=>api(`/api/groups/?project=${selected!.slug}`).then(setGroups))}
                    >
                      Ignore
                    </button>
                    <button 
                      data-testid={`assign-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => setAssignModal({groupId: g.id, currentAssignee: g.assignee || ''})}
                    >
                      Assign
                    </button>
                    <button 
                      data-testid={`comment-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => setCommentModal({groupId: g.id})}
                    >
                      Comment
                    </button>
                    {rules.length > 0 ? (
                      <button 
                        data-testid={`snooze-group-${g.id}`}
                        className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                        onClick={() => snoozeGroup(g.id, 60)}
                      >
                        Snooze
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assignment Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Assign Issue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Assign to user:</label>
                <input
                  type="text"
                  placeholder="Enter username or email"
                  defaultValue={assignModal.currentAssignee}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const assignee = (e.target as HTMLInputElement).value;
                      api(`/api/groups/${assignModal.groupId}/assign/`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({assignee})
                      }).then(() => {
                        api(`/api/groups/?project=${selected!.slug}`).then(setGroups);
                        setAssignModal(null);
                      });
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">Press Enter to assign, or leave empty to unassign</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 text-sm border border-slate-600 rounded hover:bg-slate-700"
                  onClick={() => setAssignModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
                  onClick={() => {
                    const input = document.querySelector('.fixed input') as HTMLInputElement;
                    const assignee = input?.value || '';
                    api(`/api/groups/${assignModal.groupId}/assign/`, {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({assignee})
                    }).then(() => {
                      api(`/api/groups/?project=${selected!.slug}`).then(setGroups);
                      setAssignModal(null);
                    });
                  }}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {commentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Add Comment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Comment:</label>
                <textarea
                  placeholder="Enter your comment..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm h-24 resize-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 text-sm border border-slate-600 rounded hover:bg-slate-700"
                  onClick={() => setCommentModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded text-white"
                  onClick={() => {
                    const textarea = document.querySelector('.fixed textarea') as HTMLTextAreaElement;
                    const body = textarea?.value || '';
                    if (body.trim()) {
                      api(`/api/groups/${commentModal.groupId}/comments/`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({author: 'ui', body})
                      }).then(() => {
                        setCommentModal(null);
                        // Show success notification
                        const notification = document.createElement('div');
                        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
                        notification.textContent = 'Comment added successfully!';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 3000);
                      });
                    }
                  }}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
