import { useEffect, useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, BrushComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Types
import type { 
  Project, 
  Group, 
  Event, 
  Release, 
  AlertRule, 
  Deployment,
  TimeRange,
  TimeInterval,
  NavigationTab,
  EventDetails,
  EditRuleState,
  TimeSelection,
  CustomRangeType
} from './types/app.types'

// Components
import { Dashboard } from './Dashboard'
import { OverviewPage } from './components/OverviewPage'
import { NavRail } from './components/NavRail'
import { LogsView } from './components/LogsView'
import { ProjectsTab } from './components/ProjectsTab'

// Hooks
import { useProjects } from './hooks/useProjects'

// Utils
import { api } from './utils/api.utils'
import { asList } from './utils/data.utils'

// Initialize ECharts
echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, BrushComponent, CanvasRenderer])

interface AppState {
  selected: Project | null
  groups: Group[]
  events: Event[]
  msg: string
  releases: Release[]
  rules: AlertRule[]
  health: any[]
  deploys: Deployment[]
  sessionUser: string
  eventDetails: EventDetails
  editRule: EditRuleState
  series: any[]
  range: TimeRange
  interval: TimeInterval
  filterLevel: string
  filterEnv: string
  filterRelease: string
  search: string
  activeTab: NavigationTab
  initializedFromURL: boolean
  timeSel: TimeSelection | null
  eventLimit: number
  eventOffset: number
  eventTotal: number
  customRange: CustomRangeType | null
}

const initialState: AppState = {
  selected: null,
  groups: [],
  events: [],
  msg: 'Example error from UI',
  releases: [],
  rules: [],
  health: [],
  deploys: [],
  sessionUser: 'user-123',
  eventDetails: {},
  editRule: { threshold: 10, window: 5, notify: 60 },
  series: [],
  range: '24h',
  interval: '5m',
  filterLevel: '',
  filterEnv: '',
  filterRelease: '',
  search: '',
  activeTab: 'logs',
  initializedFromURL: false,
  timeSel: null,
  eventLimit: 50,
  eventOffset: 0,
  eventTotal: 0,
  customRange: null
}

export const App = () => {
  const { projects, reload } = useProjects()
  const [state, setState] = useState<AppState>(initialState)

  // URL initialization
  useEffect(() => {
    if (state.initializedFromURL) return
    
    const params = new URLSearchParams(window.location.hash.slice(1))
    const updates: Partial<AppState> = { initializedFromURL: true }
    
    const view = params.get('view') as NavigationTab
    if (view && ['logs', 'overview', 'dashboard', 'projects'].includes(view)) {
      updates.activeTab = view
    }
    
    const q = params.get('q')
    if (q) updates.search = q
    
    const lvl = params.get('level')
    if (lvl) updates.filterLevel = lvl
    
    const env = params.get('env')
    if (env) updates.filterEnv = env
    
    const rel = params.get('release')
    if (rel) updates.filterRelease = rel
    
    const from = params.get('from')
    const to = params.get('to')
    if (from && to) updates.timeSel = { from, to }
    
    const lim = params.get('limit')
    const off = params.get('offset')
    if (lim) updates.eventLimit = parseInt(lim, 10) || 50
    if (off) updates.eventOffset = parseInt(off, 10) || 0
    
    setState(prev => ({ ...prev, ...updates }))
  }, [state.initializedFromURL])

  // Project selection from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const wanted = params.get('project')
    
    if (projects.length === 0) return
    
    if (wanted) {
      const bySlug = projects.find(p => p.slug === wanted)
      if (bySlug) {
        setState(prev => ({
          ...prev,
          selected: bySlug,
          range: '24h',
          interval: '1h',
          timeSel: null,
          customRange: null
        }))
        return
      }
    }
    
    if (!state.selected) {
      const lastProjectSlug = localStorage.getItem('mini-sentry-last-project')
      if (lastProjectSlug) {
        const lastProject = projects.find(p => p.slug === lastProjectSlug)
        if (lastProject) {
          setState(prev => ({
            ...prev,
            selected: lastProject,
            range: '24h',
            interval: '1h',
            timeSel: null,
            customRange: null
          }))
          return
        }
      }
      
      setState(prev => ({
        ...prev,
        selected: projects[0],
        range: '24h',
        interval: '1h',
        timeSel: null,
        customRange: null
      }))
    }
  }, [projects, state.selected])

  // URL state sync
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('view', state.activeTab)
    
    if (state.selected) {
      params.set('project', state.selected.slug)
      localStorage.setItem('mini-sentry-last-project', state.selected.slug)
    }
    
    if (state.search) params.set('q', state.search)
    if (state.filterLevel) params.set('level', state.filterLevel)
    if (state.filterEnv) params.set('env', state.filterEnv)
    if (state.filterRelease) params.set('release', state.filterRelease)
    if (state.timeSel) {
      params.set('from', state.timeSel.from)
      params.set('to', state.timeSel.to)
    }
    if (state.eventLimit) params.set('limit', String(state.eventLimit))
    if (state.eventOffset) params.set('offset', String(state.eventOffset))
    
    const newHash = '#' + params.toString()
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash)
    }
  }, [
    state.activeTab, 
    state.selected, 
    state.search, 
    state.filterLevel, 
    state.filterEnv, 
    state.filterRelease, 
    state.timeSel, 
    state.eventLimit, 
    state.eventOffset
  ])

  // Data fetching
  useEffect(() => {
    if (!state.selected) return
    
    let timeParams: TimeSelection | null = null
    if (state.timeSel) {
      timeParams = state.timeSel
    } else if (state.customRange || state.range !== '24h' || state.range === '1h') {
      const now = Date.now()
      let minutes = 0
      
      if (state.customRange) {
        minutes = state.customRange.unit === 'm' ? state.customRange.value :
                 state.customRange.unit === 'h' ? state.customRange.value * 60 :
                 state.customRange.unit === 'd' ? state.customRange.value * 24 * 60 :
                 state.customRange.unit === 'w' ? state.customRange.value * 7 * 24 * 60 : 1440
      } else {
        minutes = state.range === '1h' ? 60 : 
                 state.range === '24h' ? 1440 : 
                 state.range === '7d' ? 10080 : 
                 state.range === '14d' ? 20160 : 
                 state.range === '30d' ? 43200 : 
                 state.range === '90d' ? 129600 : 525600
      }
      
      timeParams = {
        from: new Date(now - minutes * 60 * 1000).toISOString(),
        to: new Date(now).toISOString()
      }
    }
    
    // Fetch groups
    const gq = new URLSearchParams({ project: state.selected.slug })
    if (timeParams) {
      gq.set('from', timeParams.from)
      gq.set('to', timeParams.to)
    }
    api(`/api/groups/?${gq.toString()}`)
      .then(d => setState(prev => ({ ...prev, groups: asList<Group>(d) })))
      .catch(() => {})
    
    // Fetch events
    const q = new URLSearchParams({ project: state.selected.slug })
    if (state.filterLevel) q.set('level', state.filterLevel)
    if (state.filterEnv) q.set('environment', state.filterEnv)
    if (state.filterRelease) q.set('release', state.filterRelease)
    if (state.search) q.set('q', state.search)
    if (timeParams) {
      q.set('from', timeParams.from)
      q.set('to', timeParams.to)
    }
    if (state.activeTab === 'logs') {
      q.set('limit', String(state.eventLimit))
      q.set('offset', String(state.eventOffset))
    }
    
    api(`/api/events/?${q.toString()}`)
      .then((d) => {
        const updates: Partial<AppState> = {}
        if (Array.isArray(d)) {
          updates.events = d
          updates.eventTotal = d.length
        } else if (d && d.results) {
          updates.events = d.results
          updates.eventTotal = d.count || 0
        } else {
          updates.events = []
          updates.eventTotal = 0
        }
        setState(prev => ({ ...prev, ...updates }))
      })
      .catch(() => {})
    
    // Fetch other data
    Promise.all([
      api(`/api/releases/?project=${state.selected.slug}`).then(d => asList<Release>(d)).catch(() => []),
      api(`/api/alert-rules/?project=${state.selected.slug}`).then(d => asList<AlertRule>(d)).catch(() => []),
      api(`/api/releases/health/?project=${state.selected.slug}`).then(d => d).catch(() => []),
      api(`/api/deployments/?project=${state.selected.slug}`).then(d => asList<Deployment>(d)).catch(() => []),
      api(`/api/releases/health/series/?project=${state.selected.slug}&range=${state.range}&interval=${state.interval}`).then(d => d).catch(() => [])
    ]).then(([releases, rules, health, deploys, series]) => {
      setState(prev => ({
        ...prev,
        releases,
        rules,
        health,
        deploys,
        series
      }))
    })
  }, [
    state.selected,
    state.filterLevel,
    state.filterEnv,
    state.filterRelease,
    state.search,
    state.timeSel,
    state.eventLimit,
    state.eventOffset,
    state.activeTab,
    state.customRange,
    state.range
  ])

  // Reset pagination when filters change
  useEffect(() => {
    setState(prev => ({ ...prev, eventOffset: 0 }))
  }, [
    state.selected,
    state.filterLevel,
    state.filterEnv,
    state.filterRelease,
    state.search,
    state.timeSel,
    state.customRange,
    state.range
  ])

  // Event handlers
  const createProject = useCallback(async (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const created = await api('/api/projects/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })
    await reload()
    if (created && created.id) {
      setState(prev => ({ ...prev, selected: created }))
    }
  }, [reload])

  const sendEvent = useCallback(async () => {
    if (!state.selected) return
    
    await api(`/api/events/ingest/token/${state.selected.ingest_token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: state.msg, 
        level: 'error', 
        ui: true, 
        tags: [{ source: 'ui' }] 
      }),
    })
    
    setTimeout(() => {
      if (!state.selected) return
      api(`/api/groups/?project=${state.selected.slug}`)
        .then(d => setState(prev => ({ ...prev, groups: asList<Group>(d) })))
        .catch(() => {})
      api(`/api/events/?project=${state.selected.slug}`)
        .then(d => {
          const updates: Partial<AppState> = {}
          if (Array.isArray(d)) updates.events = d
          else if (d && d.results) updates.events = d.results
          else updates.events = []
          setState(prev => ({ ...prev, ...updates }))
        })
        .catch(() => {})
    }, 500)
  }, [state.selected, state.msg])

  const createRelease = useCallback(async (version: string, environment: string) => {
    if (!state.selected) return
    
    await api('/api/releases/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: state.selected.id, version, environment }),
    })
    
    const [releases, health] = await Promise.all([
      api(`/api/releases/?project=${state.selected.slug}`).then(d => asList<Release>(d)),
      api(`/api/releases/health/?project=${state.selected.slug}`)
    ])
    
    setState(prev => ({ ...prev, releases, health }))
  }, [state.selected])

  const createDeployment = useCallback(async (name: string, url: string, environment: string, releaseId?: number) => {
    if (!state.selected) return
    if (!releaseId && state.releases.length === 0) return
    
    const rid = releaseId || state.releases[0].id
    await api('/api/deployments/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        project: state.selected.id, 
        release: rid, 
        name, 
        url, 
        environment 
      })
    })
    
    const deploys = await api(`/api/deployments/?project=${state.selected.slug}`)
      .then(d => asList<Deployment>(d))
    setState(prev => ({ ...prev, deploys }))
  }, [state.selected, state.releases])

  const createRule = useCallback(async (name: string, level: string, threshold: number, targetType: 'email'|'webhook', targetValue: string) => {
    if (!state.selected) return
    
    await api('/api/alert-rules/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        project: state.selected.id, 
        name, 
        level, 
        threshold_count: threshold, 
        target_type: targetType, 
        target_value: targetValue 
      }),
    })
    
    const rules = await api(`/api/alert-rules/?project=${state.selected.slug}`)
      .then(d => asList<AlertRule>(d))
    setState(prev => ({ ...prev, rules }))
  }, [state.selected])

  const fetchEvent = useCallback(async (id: number) => {
    const d = await api(`/api/events/${id}/`)
    let symSource: 'stored' | 'live' | undefined
    
    if (d.symbolicated?.frames?.length) symSource = 'stored'
    
    if ((!d.symbolicated || !d.symbolicated.frames || d.symbolicated.frames.length === 0) && 
        d.stack && d.release && state.selected) {
      const relObj = state.releases.find(r => r.id === d.release)
      if (relObj) {
        try {
          const sym = await api(`/api/symbolicate/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project: state.selected.slug,
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
    setState(prev => ({
      ...prev,
      eventDetails: { ...prev.eventDetails, [id]: d }
    }))
  }, [state.selected, state.releases])

  const updateFirstRule = useCallback(async () => {
    if (!state.selected || state.rules.length === 0) return
    
    const id = state.rules[0].id
    await api(`/api/alert-rules/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        threshold_count: state.editRule.threshold, 
        threshold_window_minutes: state.editRule.window, 
        notify_interval_minutes: state.editRule.notify 
      })
    })
    
    const rules = await api(`/api/alert-rules/?project=${state.selected.slug}`)
      .then(d => asList<AlertRule>(d))
    setState(prev => ({ ...prev, rules }))
  }, [state.selected, state.rules, state.editRule])

  const sendSession = useCallback(async (status: 'init'|'ok'|'errored'|'crashed'|'exited') => {
    if (!state.selected) return
    
    const sessionId = Math.random().toString(36).slice(2)
    await api(`/api/sessions/ingest/token/${state.selected.ingest_token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        session_id: sessionId, 
        status, 
        user: state.sessionUser, 
        release: state.releases[0]?.version || '1.0.0', 
        environment: 'production', 
        duration_ms: status === 'ok' ? 1200 : 0 
      })
    })
    
    const [health, series] = await Promise.all([
      api(`/api/releases/health/?project=${state.selected.slug}`),
      api(`/api/releases/health/series/?project=${state.selected.slug}&range=${state.range}&interval=${state.interval}`)
    ])
    
    setState(prev => ({ ...prev, health, series }))
  }, [state.selected, state.sessionUser, state.releases, state.range, state.interval])

  const refreshSeries = useCallback(() => {
    if (!state.selected) return
    api(`/api/releases/health/series/?project=${state.selected.slug}&range=${state.range}&interval=${state.interval}`)
      .then(series => setState(prev => ({ ...prev, series })))
  }, [state.selected, state.range, state.interval])

  const snoozeGroup = useCallback(async (groupId: number, minutes = 60) => {
    if (!state.selected || state.rules.length === 0) return
    
    const ruleId = state.rules[0].id
    await api(`/api/alert-rules/${ruleId}/snooze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: groupId, minutes })
    })
    alert('Snoozed alerts for this group')
  }, [state.selected, state.rules])

  // State setters
  const setSelected = useCallback((p: Project) => {
    setState(prev => ({ ...prev, selected: p }))
  }, [])

  const setActiveTab = useCallback((tab: NavigationTab) => {
    setState(prev => ({ ...prev, activeTab: tab }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setState(prev => ({ ...prev, search }))
  }, [])

  const setFilterLevel = useCallback((filterLevel: string) => {
    setState(prev => ({ ...prev, filterLevel }))
  }, [])

  const setFilterEnv = useCallback((filterEnv: string) => {
    setState(prev => ({ ...prev, filterEnv }))
  }, [])

  const setFilterRelease = useCallback((filterRelease: string) => {
    setState(prev => ({ ...prev, filterRelease }))
  }, [])

  const setRange = useCallback((range: TimeRange) => {
    setState(prev => ({ ...prev, range }))
  }, [])

  const setInterval = useCallback((interval: TimeInterval) => {
    setState(prev => ({ ...prev, interval }))
  }, [])

  const setTimeSel = useCallback((timeSel: TimeSelection | null) => {
    setState(prev => ({ ...prev, timeSel }))
  }, [])

  const setEventLimit = useCallback((eventLimit: number) => {
    setState(prev => ({ ...prev, eventLimit }))
  }, [])

  const setEventOffset = useCallback((eventOffset: number) => {
    setState(prev => ({ ...prev, eventOffset }))
  }, [])

  const setCustomRange = useCallback((customRange: CustomRangeType | null) => {
    setState(prev => ({ ...prev, customRange }))
  }, [])

  const setMsg = useCallback((msg: string) => {
    setState(prev => ({ ...prev, msg }))
  }, [])

  const setSessionUser = useCallback((sessionUser: string) => {
    setState(prev => ({ ...prev, sessionUser }))
  }, [])

  const setEditRule = useCallback((editRule: EditRuleState) => {
    setState(prev => ({ ...prev, editRule }))
  }, [])

  const setGroups = useCallback((groups: Group[]) => {
    setState(prev => ({ ...prev, groups }))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="w-full px-6 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Mini Sentry UI</h1>
        <div className="grid grid-cols-[56px_1fr] gap-6">
          <NavRail activeTab={state.activeTab} onChange={setActiveTab} />
          <main className="min-w-0 flex-1">
            <div className="space-y-4">
              {state.activeTab === 'projects' ? (
                <ProjectsTab
                  projects={projects}
                  selected={state.selected || projects[0]}
                  setSelected={setSelected}
                  onCreate={createProject}
                />
              ) : state.activeTab === 'dashboard' ? (
                state.selected ? (
                  <Dashboard 
                    projectSlug={state.selected.slug} 
                    fromTo={state.timeSel || undefined} 
                  />
                ) : (
                  <p className="text-sm text-slate-400">
                    Create or select a project in Projects tab.
                  </p>
                )
              ) : state.activeTab === 'logs' ? (
                state.selected ? (
                  <LogsView
                    selected={state.selected}
                    projects={projects}
                    setSelected={setSelected}
                    search={state.search}
                    setSearch={setSearch}
                    filterLevel={state.filterLevel}
                    setFilterLevel={setFilterLevel}
                    filterEnv={state.filterEnv}
                    setFilterEnv={setFilterEnv}
                    filterRelease={state.filterRelease}
                    setFilterRelease={setFilterRelease}
                    events={state.events}
                    onView={fetchEvent}
                    eventDetails={state.eventDetails}
                    range={state.range}
                    interval={state.interval}
                    setRange={setRange}
                    setInterval={setInterval}
                    onSendTest={sendEvent}
                    msg={state.msg}
                    setMsg={setMsg}
                    timeSel={state.timeSel}
                    setTimeSel={setTimeSel}
                    eventLimit={state.eventLimit}
                    setEventLimit={setEventLimit}
                    eventOffset={state.eventOffset}
                    setEventOffset={setEventOffset}
                    eventTotal={state.eventTotal}
                    customRange={state.customRange}
                    setCustomRange={setCustomRange}
                  />
                ) : (
                  <p className="text-sm text-slate-400">
                    Create or select a project in Projects tab.
                  </p>
                )
              ) : (
                state.selected ? (
                  <OverviewPage
                    selected={state.selected}
                    releases={state.releases}
                    createRelease={createRelease}
                    deploys={state.deploys}
                    createDeployment={createDeployment}
                    sessionUser={state.sessionUser}
                    setSessionUser={setSessionUser}
                    sendSession={sendSession}
                    range={state.range}
                    setRange={setRange}
                    interval={state.interval}
                    setInterval={setInterval}
                    refreshSeries={refreshSeries}
                    series={state.series}
                    health={state.health}
                    rules={state.rules}
                    createRule={createRule}
                    editRule={state.editRule}
                    setEditRule={setEditRule}
                    updateFirstRule={updateFirstRule}
                    groups={state.groups}
                    setGroups={setGroups}
                    snoozeGroup={snoozeGroup}
                  />
                ) : (
                  <p 
                    className="text-sm text-slate-400" 
                    data-testid="overview-no-project"
                  >
                    Create or select a project in Projects tab.
                  </p>
                )
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}