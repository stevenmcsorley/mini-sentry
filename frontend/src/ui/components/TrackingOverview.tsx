import { useEffect, useState } from 'react'
import { api } from '../utils/api.utils'

interface TrackingItem {
  id: number
  source: string
  kind: string
  detail: string
  location: string
  status: 'active' | 'planned' | 'removed'
  origin: string
  updated_at: string
}

interface Overview {
  project: { id: number; name: string; slug: string; description: string; ingest_token: string; created_at: string }
  stats: { events_total: number; groups_total: number; groups_unresolved: number; first_event_at: string | null; last_event_at: string | null }
  sources: { sampled_events: number; environments: string[]; levels: Record<string, number>; platforms: string[]; tag_keys: string[] }
  tracking: TrackingItem[]
  releases: string[]
  alert_rules: Array<{ name: string; active: boolean; target_type: string }>
  integrations: string[]
  external_links_total: number
  ingest_endpoint: string
}

const SOURCES = ['frontend', 'backend', 'mobile', 'infra', 'job', 'test', 'other'] as const
const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300',
  planned: 'bg-amber-500/20 text-amber-300',
  removed: 'bg-slate-600/30 text-slate-400 line-through',
}
const SOURCE_STYLE: Record<string, string> = {
  frontend: 'bg-sky-500/20 text-sky-300',
  backend: 'bg-violet-500/20 text-violet-300',
  mobile: 'bg-pink-500/20 text-pink-300',
  infra: 'bg-orange-500/20 text-orange-300',
  job: 'bg-teal-500/20 text-teal-300',
  test: 'bg-slate-500/20 text-slate-300',
  other: 'bg-slate-500/20 text-slate-300',
}

const chip = 'rounded-full bg-slate-800/70 px-2.5 py-1 text-xs text-slate-200'
function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <span className="text-xs text-slate-500">{empty}</span>
  return <div className="flex flex-wrap gap-1.5">{items.map(i => <span key={i} className={chip}>{i}</span>)}</div>
}

const blank = { source: 'frontend', kind: '', detail: '', location: '', status: 'active' as const }

export function TrackingOverview({ slug }: { slug: string }) {
  const [data, setData] = useState<Overview | null>(null)
  const [editingDesc, setEditingDesc] = useState(false)
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<{ source: string; kind: string; detail: string; location: string; status: string }>(blank)

  const base = `/api/projects/${encodeURIComponent(slug)}`
  const load = () => api(`${base}/overview/`).then(setData).catch(() => setData(null))
  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug])

  const saveDesc = async () => {
    const u = await api(`${base}/overview/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: draft }) })
    setData(u); setEditingDesc(false)
  }
  const addItem = async () => {
    if (!form.kind.trim()) return
    await api(`${base}/tracking/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, origin: 'human' }) })
    setForm(blank); setAdding(false); load()
  }
  const setStatus = async (id: number, status: string) => {
    await api(`${base}/tracking/${id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }
  const remove = async (id: number) => {
    if (!window.confirm('Remove this monitor from the inventory?')) return
    await api(`${base}/tracking/${id}/`, { method: 'DELETE' }); load()
  }

  if (!data) return null
  const s = data.stats
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString() : '—')
  const declared = data.tracking.filter(t => t.status !== 'removed')

  return (
    <section data-testid="tracking-overview" className="space-y-6 rounded-xl border border-slate-800/60 bg-slate-900/40 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">What we're monitoring</h3>
          <p className="text-sm text-slate-400">The monitors set up for this project (mostly by the AI agent), and what data is actually arriving.</p>
        </div>
        {!editingDesc && (
          <button onClick={() => { setDraft(data.project.description || ''); setEditingDesc(true) }} className="text-xs text-emerald-400 hover:text-emerald-300">
            {data.project.description ? 'Edit summary' : 'Add summary'}
          </button>
        )}
      </div>

      {/* Human/agent summary */}
      {editingDesc ? (
        <div>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3}
            placeholder="One-line summary of what this project monitors and why."
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none" />
          <div className="mt-2 flex gap-2">
            <button onClick={saveDesc} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500">Save</button>
            <button onClick={() => setEditingDesc(false)} className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      ) : data.project.description ? (
        <p className="text-sm text-slate-300">{data.project.description}</p>
      ) : null}

      {/* DECLARED monitors — the inventory */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-200">Declared monitors <span className="text-slate-500">({declared.length})</span></h4>
          <button onClick={() => setAdding(a => !a)} className="text-xs text-emerald-400 hover:text-emerald-300" data-testid="add-monitor">
            {adding ? 'Close' : '+ Add monitor'}
          </button>
        </div>

        {adding && (
          <div className="mb-3 grid gap-2 rounded-lg border border-slate-700/60 bg-slate-950/40 p-3 sm:grid-cols-2">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100">
              {SOURCES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))} placeholder="kind — e.g. window.onerror" className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100" />
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="location — file or endpoint" className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100" />
            <input value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} placeholder="detail — what it captures" className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100" />
            <div className="sm:col-span-2">
              <button onClick={addItem} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500">Add</button>
            </div>
          </div>
        )}

        {declared.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700/60 p-4 text-sm text-slate-500">
            No monitors declared yet. Ask the AI agent: <em>“list what you're tracking in this project”</em> or <em>“add tracking for the backend 5xx handler.”</em>
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/60 overflow-hidden rounded-lg border border-slate-800/60">
            {declared.map(t => (
              <li key={t.id} className="flex items-start justify-between gap-3 bg-slate-900/30 p-3" data-testid={`monitor-${t.id}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] ${SOURCE_STYLE[t.source] || SOURCE_STYLE.other}`}>{t.source}</span>
                    <span className="text-sm font-medium text-slate-100">{t.kind}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                    <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[11px] text-slate-400" title="who declared it">{t.origin}</span>
                  </div>
                  {t.detail && <div className="mt-1 text-xs text-slate-400">{t.detail}</div>}
                  {t.location && <div className="mt-0.5 font-mono text-[11px] text-slate-500">{t.location}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  {t.status !== 'active' && <button onClick={() => setStatus(t.id, 'active')} className="text-emerald-400 hover:text-emerald-300">Activate</button>}
                  {t.status === 'active' && <button onClick={() => setStatus(t.id, 'removed')} className="text-amber-400 hover:text-amber-300">Retire</button>}
                  <button onClick={() => remove(t.id)} className="text-red-400 hover:text-red-300">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* OBSERVED — what's actually arriving, to confirm the monitors are live */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-slate-200">
          Actually arriving <span className="text-slate-500">(from the last {data.sources.sampled_events} events)</span>
        </h4>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Events', s.events_total], ['Issues', s.groups_total], ['Unresolved', s.groups_unresolved], ['Linked tickets', data.external_links_total]].map(([label, val]) => (
            <div key={label as string} className="rounded-lg border border-slate-800/60 bg-slate-800/20 p-3 text-center">
              <div className="text-xl font-bold text-white">{val as number}</div>
              <div className="text-xs text-slate-400">{label as string}</div>
            </div>
          ))}
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">Environments</dt><dd><Chips items={data.sources.environments} empty="No events yet" /></dd></div>
          <div><dt className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">Platforms / SDKs</dt><dd><Chips items={data.sources.platforms} empty="Not reported by the SDK" /></dd></div>
          <div><dt className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">Tag keys seen</dt><dd><Chips items={data.sources.tag_keys} empty="No tags" /></dd></div>
          <div><dt className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">Recent releases</dt><dd><Chips items={data.releases} empty="No releases tracked" /></dd></div>
          <div><dt className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">Integrations</dt><dd><Chips items={data.integrations} empty="None configured" /></dd></div>
          <div><dt className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">Alert rules</dt><dd><Chips items={data.alert_rules.map(r => `${r.name}${r.active ? '' : ' (off)'}`)} empty="No alert rules" /></dd></div>
        </dl>
      </div>

      <div className="border-t border-slate-800/60 pt-4 text-xs text-slate-400">
        <div>First event: <span className="text-slate-200">{fmt(s.first_event_at)}</span> · Last event: <span className="text-slate-200">{fmt(s.last_event_at)}</span></div>
        <div className="mt-1">Ingest endpoint: <code className="rounded bg-slate-950 px-1.5 py-0.5 text-slate-300">{data.ingest_endpoint}</code></div>
      </div>
    </section>
  )
}
