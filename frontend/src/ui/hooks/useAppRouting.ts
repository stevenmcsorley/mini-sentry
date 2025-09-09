import { useState, useEffect, useCallback } from 'react'
import type { 
  Project, 
  NavigationTab, 
  TimeSelection, 
  CustomRangeType,
  TimeRange,
  TimeInterval
} from '../types/app.types'

interface RoutingState {
  activeTab: NavigationTab
  selected: Project | null
  search: string
  filterLevel: string
  filterEnv: string
  filterRelease: string
  timeSel: TimeSelection | null
  eventLimit: number
  eventOffset: number
  customRange: CustomRangeType | null
  range: TimeRange
  interval: TimeInterval
  initializedFromURL: boolean
}

interface RoutingActions {
  setActiveTab: (tab: NavigationTab) => void
  setSelected: (project: Project) => void
  setSearch: (search: string) => void
  setFilterLevel: (level: string) => void
  setFilterEnv: (env: string) => void
  setFilterRelease: (release: string) => void
  setTimeSel: (timeSel: TimeSelection | null) => void
  setEventLimit: (limit: number) => void
  setEventOffset: (offset: number) => void
  setCustomRange: (range: CustomRangeType | null) => void
  setRange: (range: TimeRange) => void
  setInterval: (interval: TimeInterval) => void
}

export const useAppRouting = (
  projects: Project[]
): RoutingState & RoutingActions => {
  const [state, setState] = useState<RoutingState>({
    activeTab: 'logs',
    selected: null,
    search: '',
    filterLevel: '',
    filterEnv: '',
    filterRelease: '',
    timeSel: null,
    eventLimit: 50,
    eventOffset: 0,
    customRange: null,
    range: '24h',
    interval: '5m',
    initializedFromURL: false
  })

  // Initialize from URL hash on first load
  useEffect(() => {
    if (state.initializedFromURL) return
    
    const params = new URLSearchParams(window.location.hash.slice(1))
    const updates: Partial<RoutingState> = { initializedFromURL: true }
    
    // Parse URL parameters
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

  // Handle project selection from URL and localStorage
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
      // Check localStorage for previously selected project
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
      
      // Fall back to first project
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

  // Sync state to URL hash
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

  // State setters
  const setActiveTab = useCallback((activeTab: NavigationTab) => {
    setState(prev => ({ ...prev, activeTab }))
  }, [])

  const setSelected = useCallback((selected: Project) => {
    setState(prev => ({ ...prev, selected }))
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

  const setRange = useCallback((range: TimeRange) => {
    setState(prev => ({ ...prev, range }))
  }, [])

  const setInterval = useCallback((interval: TimeInterval) => {
    setState(prev => ({ ...prev, interval }))
  }, [])

  return {
    ...state,
    setActiveTab,
    setSelected,
    setSearch,
    setFilterLevel,
    setFilterEnv,
    setFilterRelease,
    setTimeSel,
    setEventLimit,
    setEventOffset,
    setCustomRange,
    setRange,
    setInterval
  }
}