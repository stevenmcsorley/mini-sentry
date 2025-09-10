import { useState, useEffect, useCallback } from 'react'
import type { 
  Group, 
  Event, 
  Release, 
  AlertRule, 
  Deployment,
  Project,
  TimeSelection,
  CustomRangeType,
  TimeRange,
  TimeInterval,
  NavigationTab
} from '../types/app.types'
import { api } from '../utils/api.utils'
import { asList } from '../utils/data.utils'

interface ProjectDataState {
  groups: Group[]
  events: Event[]
  releases: Release[]
  rules: AlertRule[]
  health: any[]
  deploys: Deployment[]
  series: any[]
  eventTotal: number
  loading: boolean
}

interface ProjectDataHookParams {
  selected: Project | null
  filterLevel: string
  filterEnv: string
  filterRelease: string
  search: string
  timeSel: TimeSelection | null
  eventLimit: number
  eventOffset: number
  activeTab: NavigationTab
  customRange: CustomRangeType | null
  range: TimeRange
  interval: TimeInterval
}

const initialState: ProjectDataState = {
  groups: [],
  events: [],
  releases: [],
  rules: [],
  health: [],
  deploys: [],
  series: [],
  eventTotal: 0,
  loading: false
}

export const useProjectData = (params: ProjectDataHookParams) => {
  const [state, setState] = useState<ProjectDataState>(initialState)

  const {
    selected,
    filterLevel,
    filterEnv,
    filterRelease,
    search,
    timeSel,
    eventLimit,
    eventOffset,
    activeTab,
    customRange,
    range,
    interval
  } = params

  const fetchData = useCallback(async () => {
    if (!selected) return
    
    setState(prev => ({ ...prev, loading: true }))

    try {
      // Calculate time parameters
      let timeParams = timeSel
      if (!timeParams && (customRange || range !== '24h')) {
        const now = Date.now()
        let minutes = 0
        
        if (customRange) {
          minutes = customRange.unit === 'm' ? customRange.value :
                   customRange.unit === 'h' ? customRange.value * 60 :
                   customRange.unit === 'd' ? customRange.value * 24 * 60 :
                   customRange.unit === 'w' ? customRange.value * 7 * 24 * 60 : 1440
        } else {
          minutes = range === '1h' ? 60 : 
                   range === '24h' ? 1440 : 
                   range === '7d' ? 10080 : 
                   range === '14d' ? 20160 : 
                   range === '30d' ? 43200 : 
                   range === '90d' ? 129600 : 525600
        }
        
        timeParams = {
          from: new Date(now - minutes * 60 * 1000).toISOString(),
          to: new Date(now).toISOString()
        }
      }
      
      // Fetch groups
      const gq = new URLSearchParams({ project: selected.slug })
      if (timeParams) {
        gq.set('from', timeParams.from)
        gq.set('to', timeParams.to)
      }
      const groupsPromise = api(`/api/groups?${gq.toString()}`)
        .then(d => asList<Group>(d))
        .catch(() => [])
      
      // Fetch events
      const q = new URLSearchParams({ project: selected.slug })
      if (filterLevel) q.set('level', filterLevel)
      if (filterEnv) q.set('environment', filterEnv)
      if (filterRelease) q.set('release', filterRelease)
      if (search) q.set('q', search)
      if (timeParams) {
        q.set('from', timeParams.from)
        q.set('to', timeParams.to)
      }
      if (activeTab === 'logs') {
        q.set('limit', String(eventLimit))
        q.set('offset', String(eventOffset))
      }
      
      const eventsPromise = api(`/api/events?${q.toString()}`)
        .then((d) => {
          if (Array.isArray(d)) {
            return { events: d, total: d.length }
          } else if (d && d.results) {
            return { events: d.results, total: d.count || 0 }
          } else {
            return { events: [], total: 0 }
          }
        })
        .catch(() => ({ events: [], total: 0 }))
      
      // Fetch other data
      const releasesPromise = api(`/api/releases?project=${selected.slug}`)
        .then(d => asList<Release>(d))
        .catch(() => [])
      
      const rulesPromise = api(`/api/alert-rules?project=${selected.slug}`)
        .then(d => asList<AlertRule>(d))
        .catch(() => [])
      
      const healthPromise = api(`/api/releases/health?project=${selected.slug}`)
        .then(d => d)
        .catch(() => [])
      
      const deploysPromise = api(`/api/deployments?project=${selected.slug}`)
        .then(d => asList<Deployment>(d))
        .catch(() => [])
      
      const seriesPromise = api(`/api/releases/health/series?project=${selected.slug}&range=${range}&interval=${interval}`)
        .then(d => d)
        .catch(() => [])
      
      // Wait for all requests
      const [groups, eventsResult, releases, rules, health, deploys, series] = await Promise.all([
        groupsPromise,
        eventsPromise,
        releasesPromise,
        rulesPromise,
        healthPromise,
        deploysPromise,
        seriesPromise
      ])

      setState(prev => ({
        ...prev,
        groups,
        events: eventsResult.events,
        eventTotal: eventsResult.total,
        releases,
        rules,
        health,
        deploys,
        series,
        loading: false
      }))

    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [
    selected,
    filterLevel,
    filterEnv,
    filterRelease,
    search,
    timeSel,
    eventLimit,
    eventOffset,
    activeTab,
    customRange,
    range,
    interval
  ])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch
  }
}