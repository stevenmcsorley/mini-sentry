import { useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import React from 'react'
import type { Event, EventDetails } from '../../types/app.types'
import { LevelBadge } from '../LevelBadge'
import { fmtDate } from '../../utils/date.utils'

interface EventsListProps {
  events: Event[]
  eventDetails: EventDetails
  onView: (id: number) => void
  eventLimit: number
  setEventLimit: (limit: number) => void
  eventOffset: number
  setEventOffset: (offset: number) => void
  eventTotal: number
  className?: string
  testId?: string
}

const levelDot = (level: string) => {
  const color = level === 'error' ? 'bg-red-500' : level === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`}></span>
}

export const EventsList = ({
  events,
  eventDetails,
  onView,
  eventLimit,
  setEventLimit,
  eventOffset,
  setEventOffset,
  eventTotal,
  className,
  testId = 'events-list'
}: EventsListProps) => {
  const [open, setOpen] = useState<Record<number, boolean>>({})

  const handleToggleDetails = useCallback((eventId: number) => {
    const isOpen = !!open[eventId]
    const next = { ...open, [eventId]: !isOpen }
    setOpen(next)
    if (!isOpen && !eventDetails[eventId]) {
      onView(eventId)
    }
  }, [open, eventDetails, onView])

  const handleLimitChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setEventLimit(parseInt(e.target.value) || 50)
    setEventOffset(0)
  }, [setEventLimit, setEventOffset])

  const handlePrevPage = useCallback(() => {
    setEventOffset(Math.max(0, eventOffset - eventLimit))
  }, [eventOffset, eventLimit, setEventOffset])

  const handleNextPage = useCallback(() => {
    setEventOffset(eventOffset + eventLimit)
  }, [eventOffset, eventLimit, setEventOffset])

  return (
    <div 
      className={[
        "rounded-xl border border-slate-800/60",
        className
      ].filter(Boolean).join(" ")}
      data-testid={testId}
    >
      {/* Header */}
      <div className="grid grid-cols-[220px_1fr_120px] gap-2 border-b border-slate-800/60 px-3 py-2 text-xs text-slate-400">
        <div>TIMESTAMP</div>
        <div>MESSAGE</div>
        <div>LEVEL</div>
      </div>

      {/* Events */}
      <div className="divide-y divide-slate-800/60">
        {events.map(e => (
          <div key={e.id} className="grid grid-cols-[220px_1fr_120px] items-start gap-2 px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Toggle details"
                onClick={() => handleToggleDetails(e.id)}
                data-testid={`toggle-event-${e.id}`}
              >
                <svg 
                  viewBox="0 0 12 12" 
                  className={`h-3 w-3 transform transition-transform ${open[e.id] ? 'rotate-90' : ''}`} 
                  aria-hidden="true"
                >
                  <path d="M4 2 L8 6 L4 10 Z" fill="currentColor" />
                </svg>
              </button>
              {levelDot(e.level)}
              <span className="tabular-nums text-slate-300">{fmtDate(e.received_at)}</span>
            </div>
            <div className="min-w-0 truncate text-slate-100">{e.message}</div>
            <div className="flex items-center">
              <LevelBadge level={e.level} />
            </div>
            
            {/* Event Details */}
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
                          {Array.isArray(eventDetails[e.id].tags) && eventDetails[e.id].tags!.length ? (
                            <>
                              <dt className="text-slate-400">tags</dt>
                              <dd className="truncate">
                                {eventDetails[e.id].tags!.map((t: any) => 
                                  (t.key ? `${t.key}:${t.value}` : typeof t === 'string' ? t : JSON.stringify(t))
                                ).join(', ')}
                              </dd>
                            </>
                          ) : null}
                          {eventDetails[e.id].payload && typeof eventDetails[e.id].payload === 'object' ? (
                            Object.entries(eventDetails[e.id].payload!).slice(0, 8).map(([k, v]: any, idx: number) => (
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
                          {(eventDetails[e.id] as any)._symSource ? (
                            <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-300">
                              symbolicated: {(eventDetails[e.id] as any)._symSource}
                            </span>
                          ) : null}
                        </div>
                        {eventDetails[e.id].symbolicated?.frames?.length ? (
                          <ol className="space-y-1 text-xs">
                            {eventDetails[e.id].symbolicated!.frames!.map((fr: any, i: number) => (
                              <li key={i} className="truncate">
                                at <span className="text-slate-200">{fr.function || '<anon>'}</span> (
                                <span className="text-slate-300">
                                  {fr.orig_file || fr.file}:{fr.orig_line || fr.line}:{(fr.orig_column ?? fr.column) || 0}
                                </span>)
                              </li>
                            ))}
                          </ol>
                        ) : eventDetails[e.id].stack ? (
                          <pre className="max-h-56 overflow-auto rounded bg-slate-900/70 p-2 text-xs">
                            {eventDetails[e.id].stack}
                          </pre>
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

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-800/60 px-3 py-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select 
            className="rounded border border-slate-700 bg-slate-800 text-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={eventLimit} 
            onChange={handleLimitChange}
            data-testid="events-per-page-select"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span data-testid="pagination-info">
            {eventTotal ? `${Math.min(eventTotal, eventOffset + 1)}–${Math.min(eventTotal, eventOffset + events.length)} of ${eventTotal}` : `${events.length} rows`}
          </span>
          <button 
            type="button"
            className="rounded border border-slate-700 px-2 py-1 text-white disabled:opacity-50 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            disabled={eventOffset <= 0} 
            onClick={handlePrevPage}
            data-testid="prev-page-button"
          >
            Prev
          </button>
          <button 
            type="button"
            className="rounded border border-slate-700 px-2 py-1 text-white disabled:opacity-50 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            disabled={eventOffset + events.length >= eventTotal} 
            onClick={handleNextPage}
            data-testid="next-page-button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}