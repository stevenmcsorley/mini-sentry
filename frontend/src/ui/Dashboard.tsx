import React, { useEffect, useState } from 'react'

const api = async (path: string) => {
  const res = await fetch(path)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

type SeriesRow = { bucket: string; error: number; warning: number; info: number }

export function Dashboard({ projectSlug, fromTo }: { projectSlug: string, fromTo?: { from: string; to: string } | null }) {
  const [series, setSeries] = useState<SeriesRow[]>([])
  const [top, setTop] = useState<any[]>([])
  const [range, setRange] = useState<'1h'|'24h'>('24h')
  const [interval, setInterval] = useState<'5m'|'1h'>('5m')

  useEffect(() => {
    const base = `/api/dashboard/series/?project=${projectSlug}&backend=ch&interval=${interval}`
    const url = fromTo ? `${base}&from=${encodeURIComponent(fromTo.from)}&to=${encodeURIComponent(fromTo.to)}` : `${base}&range=${range}`
    api(url).then(setSeries).catch(()=>{})
    const baseTop = `/api/dashboard/top-groups/?project=${projectSlug}&backend=ch`
    const urlTop = fromTo ? `${baseTop}&from=${encodeURIComponent(fromTo.from)}&to=${encodeURIComponent(fromTo.to)}` : `${baseTop}&range=${range}`
    api(urlTop).then(setTop).catch(()=>{})
  }, [projectSlug, range, interval, fromTo?.from, fromTo?.to])

  const width = 560, height = 120, pad = 24
  const levels: Array<keyof SeriesRow> = ['error','warning','info']
  const colors: Record<string,string> = { error: '#ef4444', warning: '#f59e0b', info: '#60a5fa' }
  const maxY = Math.max(1, ...series.flatMap(r => [r.error, r.warning, r.info]))
  const xStep = series.length > 1 ? (width - pad*2) / (series.length - 1) : width - pad*2
  function pathFor(level: keyof SeriesRow) {
    const pts = series.map((r, i) => {
      const x = pad + i * xStep
      const y = height - pad - (r[level] / maxY) * (height - pad*2)
      return `${i===0?'M':'L'}${x},${y}`
    }).join(' ')
    return pts
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-slate-800/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <strong className="text-sm">Events per minute</strong>
          <div className="space-x-2">
            {!fromTo && (
              <>
                <select className="rounded border border-slate-700 bg-transparent px-2 py-1 text-sm" value={range} onChange={e=>setRange(e.target.value as any)}>
                  <option value="1h">1h</option>
                  <option value="24h">24h</option>
                </select>
                <select className="rounded border border-slate-700 bg-transparent px-2 py-1 text-sm" value={interval} onChange={e=>setInterval(e.target.value as any)}>
                  <option value="5m">5m</option>
                  <option value="1h">1h</option>
                </select>
              </>
            )}
          </div>
        </div>
        <svg width={width} height={height} className="h-40 w-full" viewBox={`0 0 ${width} ${height}`}>
          <rect x={0} y={0} width={width} height={height} fill="transparent" />
          {levels.map((lvl) => (
            <path key={lvl} d={pathFor(lvl)} fill="none" stroke={colors[lvl]} strokeWidth={2} />
          ))}
        </svg>
      </div>
      <div className="rounded-xl border border-slate-800/60 p-3">
        <strong className="text-sm">Top groups</strong>
        <ul className="mt-2 list-none space-y-1 p-0">
          {top.map((t, i) => (
            <li key={i} className="py-1 text-sm">
              {t.title || t.fingerprint} <span className="text-slate-400">({t.count})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
