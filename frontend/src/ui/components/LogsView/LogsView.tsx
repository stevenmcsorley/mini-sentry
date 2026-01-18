import { useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import type { LogsViewProps } from './LogsView.types'
import type { Event } from '../../types/app.types'
import { TimeRangeMenu } from '../TimeRangeMenu'
import { LevelBadge } from '../LevelBadge'
import { StatusSummary } from '../StatusSummary'
import { ToggleSwitch } from '../ToggleSwitch'
import { parseTokens, removeTokenFromQuery } from '../../utils/search.utils'
import { fmtDate } from '../../utils/date.utils'
import { useWebSocketEvents } from '../../hooks/useWebSocketEvents'
import { LogsChart } from './LogsChart'
import { EventsList } from './EventsList'
import { SearchFilters } from './SearchFilters'

export const LogsView = ({ 
  selected,
  projects,
  setSelected,
  search, 
  setSearch,
  filterLevel, 
  setFilterLevel,
  filterEnv, 
  setFilterEnv,
  filterRelease, 
  setFilterRelease,
  events,
  onView,
  eventDetails,
  range, 
  interval, 
  setRange, 
  setInterval,
  timeSel, 
  setTimeSel,
  eventLimit, 
  setEventLimit,
  eventOffset, 
  setEventOffset,
  eventTotal,
  customRange,
  setCustomRange,
  onNewRealtimeEvent,
  className,
  testId = 'logs-view'
}: LogsViewProps) => {
  const [legendSel, setLegendSel] = useState({ error: true, warning: true, info: true })
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
  const [realtimeEvents, setRealtimeEvents] = useState<Event[]>([])
  
  const tokens = parseTokens(search)
  const timeFilteredEvents = timeSel
    ? events.filter(e => {
        const ts = new Date(e.received_at).getTime()
        const from = new Date(timeSel.from).getTime()
        const to = new Date(timeSel.to).getTime()
        return !Number.isNaN(ts) && ts >= from && ts <= to
      })
    : events
  const visibleEvents = timeFilteredEvents.filter(e => legendSel[e.level ?? 'error'] !== false)

  // WebSocket real-time events handling
  const { isConnected, reconnect, disconnect } = useWebSocketEvents({
    projectSlug: selected.slug,
    enabled: realTimeEnabled,
    onNewEvent: useCallback((event) => {
      if (event.type === 'event' && onNewRealtimeEvent) {
        console.log('[LogsView] New WebSocket event received:', event)
        console.log('[LogsView] Timestamp received:', event.timestamp, 'Type:', typeof event.timestamp)
        
        // Format the WebSocket event data to match our Event type
        // Handle timestamp as either number or string and convert to ISO string
        let receivedAt = new Date().toISOString()
        if (event.timestamp) {
          const ts = typeof event.timestamp === 'string' ? parseInt(event.timestamp) : event.timestamp
          receivedAt = new Date(ts).toISOString()
        }
        
        const formattedEvent = {
          id: event.id ? parseInt(event.id) : Date.now(),
          message: event.message || '',
          level: event.level || 'error',
          received_at: receivedAt,
          environment: event.environment || '',
          fingerprint: event.fingerprint || '',
          project: event.project || selected.slug,
          user: null,
          tags: {},
          contexts: {},
          extra: {},
          metadata: {}
        }
        
        onNewRealtimeEvent(formattedEvent)
        
        // Also add to local state for chart updates
        setRealtimeEvents(prev => [formattedEvent, ...prev.slice(0, 99)]) // Keep last 100 real-time events
      }
    }, [selected.slug, onNewRealtimeEvent]),
    onError: useCallback((error: string) => {
      console.error('[LogsView] WebSocket connection error:', error)
      // Don't auto-disable on error - let user control it
    }, []),
    onConnectionChange: useCallback((connected: boolean) => {
      console.log('[LogsView] WebSocket connection status:', connected)
    }, [])
  })

  const handleProjectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const p = projects.find(pp => pp.id === Number(e.target.value))
    if (p) { 
      setSelected(p)
      setRange('24h')
      setInterval('1h')
      setTimeSel(null)
      setCustomRange(null)
    }
  }, [projects, setSelected, setRange, setInterval, setTimeSel, setCustomRange])

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [setSearch])

  const handleRealTimeToggle = useCallback((enabled: boolean) => {
    setRealTimeEnabled(enabled)
    if (!enabled) {
      // Clear real-time events when disabling real-time mode
      setRealtimeEvents([])
    }
  }, [])

  const handleEnvChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setFilterEnv(e.target.value)
  }, [setFilterEnv])

  const handleLevelChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setFilterLevel(e.target.value)
  }, [setFilterLevel])

  const handleClearFilters = useCallback(() => {
    setTimeSel(null)
    setRange('24h')
    setInterval('1h')
    setCustomRange(null)
    setLegendSel({ error: true, warning: true, info: true })
  }, [setTimeSel, setRange, setInterval, setCustomRange])

  const handleRemoveToken = useCallback((tokenRaw: string) => {
    setSearch(removeTokenFromQuery(search, tokenRaw))
  }, [search, setSearch])

  const handleRemoveTimeFilter = useCallback(() => {
    setTimeSel(null)
  }, [setTimeSel])

  return (
    <div 
      className={[
        "space-y-4",
        className
      ].filter(Boolean).join(" ")}
      data-testid={testId}
    >
      {/* Header Controls */}
      <div className="rounded-xl border border-slate-800/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <select 
              value={selected.id} 
              onChange={handleProjectChange}
              className="rounded border border-slate-700 bg-slate-800 text-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="project-selector"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.slug}</option>
              ))}
            </select>
            
            <select 
              value={filterEnv} 
              onChange={handleEnvChange}
              className="rounded border border-slate-700 bg-slate-800 text-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="environment-filter"
            >
              <option value="">All Envs</option>
              <option value="production">production</option>
              <option value="staging">staging</option>
              <option value="development">development</option>
            </select>
            
            <TimeRangeMenu 
              range={range} 
              setRange={setRange} 
              setInterval={setInterval} 
              setTimeSel={setTimeSel} 
              onCustomRange={setCustomRange} 
            />
          </div>
          
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input 
              type="text"
              value={search} 
              onChange={handleSearchChange}
              placeholder="Search for logs, users, tags, and more" 
              className="w-full rounded border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              data-testid="search-input"
              autoComplete="off"
            />
          </div>
          
          <StatusSummary projectSlug={selected.slug} />
          
          <div className="flex items-center gap-4">
            <ToggleSwitch
              enabled={realTimeEnabled}
              onToggle={handleRealTimeToggle}
              label="Real-time"
              testId="real-time-toggle"
            />
            
            {realTimeEnabled && !isConnected && (
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span>Connecting...</span>
              </div>
            )}
          </div>
        </div>

        <SearchFilters
          filterLevel={filterLevel}
          onLevelChange={handleLevelChange}
          timeSel={timeSel}
          onRemoveTimeFilter={handleRemoveTimeFilter}
          tokens={tokens}
          onRemoveToken={handleRemoveToken}
          onClearAll={handleClearFilters}
        />
      </div>

      {/* Chart */}
      <LogsChart
        selected={selected}
        range={range}
        interval={interval}
        timeSel={timeSel}
        setTimeSel={setTimeSel}
        customRange={customRange}
        legendSel={legendSel}
        setLegendSel={setLegendSel}
        setFilterLevel={setFilterLevel}
        filterEnv={filterEnv}
        realtimeEvents={realTimeEnabled ? realtimeEvents : []}
      />

      {/* Events List */}
      <EventsList
        events={visibleEvents}
        eventDetails={eventDetails}
        onView={onView}
        eventLimit={eventLimit}
        setEventLimit={setEventLimit}
        eventOffset={eventOffset}
        setEventOffset={setEventOffset}
        eventTotal={eventTotal}
      />
    </div>
  )
}
