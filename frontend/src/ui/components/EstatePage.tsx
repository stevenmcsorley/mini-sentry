import { useEffect, useState } from 'react'
import { api } from '../utils/api.utils'
import { LevelBadge } from './LevelBadge'

interface EstateRow {
  id: number
  name: string
  slug: string
  description: string
  events_total: number
  unresolved: number
  last_event_at: string | null
  latest_issue: { title: string; level: string; last_seen: string } | null
  last_deploy: { version: string; environment: string; at: string } | null
  active_monitors: number
}
interface Estate {
  projects: EstateRow[]
  totals: { projects: number; events_total: number; unresolved_total: number }
  integrations: string[]
}

const ago = (d: string | null) => {
  if (!d) return 'never'
  const secs = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export function EstatePage({ onOpen }: { onOpen: (slug: string) => void }) {
  const [data, setData] = useState<Estate | null>(null)
  useEffect(() => { api('/api/estate/').then(setData).catch(() => setData(null)) }, [])

  if (!data) return null
  const { projects, totals } = data
  const cleanest = [...projects].sort((a, b) => b.unresolved - a.unresolved)

  return (
    <div className="space-y-6" data-testid="estate-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Estate</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Every project in this workspace at a glance — where errors are piling up, what shipped last, and what's being monitored.
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Projects', totals.projects],
          ['Unresolved issues', totals.unresolved_total],
          ['Total events', totals.events_total],
          ['Integrations', data.integrations.length],
        ].map(([label, val]) => (
          <div key={label as string} className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center">
            <div className={`text-2xl font-bold ${label === 'Unresolved issues' && (val as number) > 0 ? 'text-red-400' : 'text-white'}`}>{val as number}</div>
            <div className="text-sm text-slate-300">{label as string}</div>
          </div>
        ))}
      </div>

      {/* Project cards */}
      {projects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700/60 p-8 text-center text-sm text-slate-500">No projects yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cleanest.map(p => (
            <button
              key={p.id}
              onClick={() => onOpen(p.slug)}
              data-testid={`estate-card-${p.slug}`}
              className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-left transition-colors hover:border-slate-700 hover:bg-slate-800/40"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{p.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs ${p.unresolved > 0 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {p.unresolved > 0 ? `${p.unresolved} open` : 'clear'}
                </span>
              </div>
              <div className="mt-1 font-mono text-xs text-slate-500">{p.slug}</div>

              {p.latest_issue ? (
                <div className="mt-3 flex items-start gap-2">
                  <LevelBadge level={p.latest_issue.level} />
                  <span className="line-clamp-2 text-xs text-slate-300">{p.latest_issue.title}</span>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-500">No errors captured</div>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                <span>{p.events_total} events</span>
                <span>last: {ago(p.last_event_at)}</span>
                <span>{p.active_monitors} monitors</span>
                {p.last_deploy && <span className="text-violet-300">🚀 {p.last_deploy.version}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
