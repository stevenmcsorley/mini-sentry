import { useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import type { LogsViewProps } from './LogsView.types'
import { TimeRangeMenu } from '../TimeRangeMenu'
import { LevelBadge } from '../LevelBadge'
import { StatusSummary } from '../StatusSummary'
import { parseTokens, removeTokenFromQuery } from '../../utils/search.utils'
import { fmtDate } from '../../utils/date.utils'
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
  onSendTest,
  msg, 
  setMsg,
  timeSel, 
  setTimeSel,
  eventLimit, 
  setEventLimit,
  eventOffset, 
  setEventOffset,
  eventTotal,
  customRange,
  setCustomRange,
  className,
  testId = 'logs-view'
}: LogsViewProps) => {
  const [legendSel, setLegendSel] = useState({ error: true, warning: true, info: true })
  
  const tokens = parseTokens(search)
  const visibleEvents = events.filter(e => legendSel[e.level ?? 'error'] !== false)

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

  const handleMsgChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setMsg(e.target.value)
  }, [setMsg])

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
          
          <div className="flex items-center gap-2">
            <input 
              type="text"
              value={msg} 
              onChange={handleMsgChange}
              className="w-48 rounded border border-slate-700 bg-slate-800 text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              data-testid="test-message-input"
              autoComplete="off"
            />
            <button 
              type="button"
              onClick={onSendTest}
              className="rounded border border-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="send-test-event-button"
            >
              Send test event
            </button>
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