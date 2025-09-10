import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, BrushComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { 
  Project, 
  TimeRange, 
  TimeInterval, 
  TimeSelection, 
  CustomRangeType, 
  LegendSelection,
  SeriesDataPoint
} from '../../types/app.types'
import { normISO, fmtDate } from '../../utils/date.utils'
import { api } from '../../utils/api.utils'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, BrushComponent, CanvasRenderer])

interface LogsChartProps {
  selected: Project
  range: TimeRange
  interval: TimeInterval
  timeSel: TimeSelection | null
  setTimeSel: (v: TimeSelection | null) => void
  customRange: CustomRangeType | null
  legendSel: LegendSelection
  setLegendSel: (sel: LegendSelection) => void
  setFilterLevel: (level: string) => void
  filterEnv?: string
  className?: string
  testId?: string
}

export const LogsChart = ({
  selected,
  range,
  interval,
  timeSel,
  setTimeSel,
  customRange,
  legendSel,
  setLegendSel,
  setFilterLevel,
  filterEnv,
  className,
  testId = 'logs-chart'
}: LogsChartProps) => {
  const [series, setSeries] = useState<SeriesDataPoint[]>([])
  const [zoomStart, setZoomStart] = useState<number | null>(null)
  const [zoomEnd, setZoomEnd] = useState<number | null>(null)
  const chartInstRef = useRef<any>(null)
  const brushTimer = useRef<any>(null)
  const isUpdatingFromCode = useRef<boolean>(false)

  useEffect(() => () => {
    if (brushTimer.current) clearTimeout(brushTimer.current)
  }, [])

  // Fetch chart data
  useEffect(() => {
    const ib = (i: string) => (i === '5m' || i === '1h') ? i : (i === '1m' ? '5m' : (i === '15m' ? '5m' : (i === '30m' ? '1h' : '1h')))
    
    let apiUrl = `/api/dashboard/series/?project=${selected.slug}&interval=${ib(interval)}&backend=ch`
    
    if (customRange && customRange.from && customRange.to) {
      // Use custom range with from/to parameters
      apiUrl += `&from=${customRange.from}&to=${customRange.to}`
    } else {
      // Use range parameter for relative time ranges
      apiUrl += `&range=${range}`
    }
    
    // Add environment filter if specified
    if (filterEnv) {
      apiUrl += `&env=${encodeURIComponent(filterEnv)}`
    }
    
    api(apiUrl)
      .then(setSeries)
      .catch(() => {})
  }, [selected.slug, range, interval, customRange, filterEnv])

  // Sync chart zoom with time selection
  useEffect(() => {
    const inst = chartInstRef.current
    if (!inst || isUpdatingFromCode.current) return
    
    try {
      const option = inst.getOption()
      if (!option) return
    } catch {
      return
    }
    
    const timer = setTimeout(() => {
      if (timeSel && timeSel.from && timeSel.to) {
        const fromVal = new Date(timeSel.from).getTime()
        const toVal = new Date(timeSel.to).getTime()
        setZoomStart(fromVal)
        setZoomEnd(toVal)
        isUpdatingFromCode.current = true
        try { 
          if (!inst.isDisposed?.()) {
            inst.dispatchAction({ type: 'dataZoom', startValue: fromVal, endValue: toVal }) 
          }
        } catch {}
        setTimeout(() => { isUpdatingFromCode.current = false }, 200)
      } else {
        setZoomStart(null)
        setZoomEnd(null)
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

  const bucketMs = interval === '1h' ? 60 * 60 * 1000 : 5 * 60 * 1000

  const totals = series.map((r: any) => ({ 
    bucket: r.bucket, 
    error: r.error || 0, 
    warning: r.warning || 0, 
    info: r.info || 0, 
    count: (r.error || 0) + (r.warning || 0) + (r.info || 0) 
  }))
  
  const chartData = useMemo(() => {
    return totals.map(r => ({
      bucket: r.bucket,
      error: r.error,
      warning: r.warning, 
      info: r.info,
      timestamp: new Date(normISO(r.bucket)).getTime()
    }))
  }, [totals])

  const handleChartReady = useCallback((inst: any) => {
    try {
      chartInstRef.current = inst
      inst.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: 'lineX', brushMode: 'single' } })
    } catch {}
  }, [])

  const handleChartClick = useCallback((p: any) => {
    if (isUpdatingFromCode.current) return
    
    const pt = Array.isArray(p?.data) ? p.data[0] : null
    if (pt != null) {
      const fromISO = new Date(pt).toISOString()
      const toISO = new Date(pt + bucketMs - 1).toISOString()
      setTimeSel({ from: fromISO, to: toISO })
      try {
        setZoomStart(pt)
        setZoomEnd(pt + bucketMs - 1)
        isUpdatingFromCode.current = true
        const inst = chartInstRef.current
        if (inst && !inst.isDisposed?.()) {
          inst.dispatchAction({ type: 'dataZoom', startValue: pt, endValue: pt + bucketMs - 1 })
        }
        setTimeout(() => { isUpdatingFromCode.current = false }, 200)
      } catch {}
    }
  }, [bucketMs, setTimeSel])

  const handleBrushEnd = useCallback((e: any) => {
    if (isUpdatingFromCode.current) return
    
    const batch = e?.areas?.[0]
    if (batch && batch.coordRange && batch.coordRange.length === 2) {
      const fromVal = batch.coordRange[0]
      const toVal = batch.coordRange[1]
      
      if (brushTimer.current) clearTimeout(brushTimer.current)
      
      const fromISO = new Date(fromVal).toISOString()
      const toISO = new Date(toVal + bucketMs - 1).toISOString()
      
      setTimeSel({ from: fromISO, to: toISO })
      try {
        setZoomStart(fromVal)
        setZoomEnd(toVal)
        isUpdatingFromCode.current = true
        const inst = chartInstRef.current
        if (inst && !inst.isDisposed?.()) {
          inst.dispatchAction({ type: 'dataZoom', startValue: fromVal, endValue: toVal })
          inst.dispatchAction({ type: 'brush', areas: [] })
        }
        setTimeout(() => { isUpdatingFromCode.current = false }, 200)
      } catch {}
    }
  }, [bucketMs, setTimeSel])

  const handleLegendChange = useCallback((e: any) => {
    const sel = e?.selected || {}
    setLegendSel(sel)
    const active = Object.keys(sel).filter(k => sel[k])
    if (active.length === 1) setFilterLevel(active[0])
    else setFilterLevel('')
  }, [setLegendSel, setFilterLevel])

  const getTimeRangeLabel = () => {
    const now = new Date()
    const end = timeSel ? new Date(timeSel.to) : now
    const minutes = customRange ? 
      (customRange.unit === 'm' ? customRange.value :
       customRange.unit === 'h' ? customRange.value * 60 :
       customRange.unit === 'd' ? customRange.value * 24 * 60 :
       customRange.unit === 'w' ? customRange.value * 7 * 24 * 60 : 1440)
      : (range === '1h' ? 60 : range === '24h' ? 1440 : range === '7d' ? 10080 : range === '14d' ? 20160 : range === '30d' ? 43200 : range === '90d' ? 129600 : 525600)
    const start = timeSel ? new Date(timeSel.from) : new Date(now.getTime() - minutes * 60 * 1000)
    const fmtOpts: any = { year: 'numeric', month: 'short', day: '2-digit' }
    return `${start.toLocaleDateString(undefined, fmtOpts)} — ${end.toLocaleDateString(undefined, fmtOpts)}`
  }

  return (
    <div 
      className={[
        "rounded-xl border border-slate-800/60 p-3",
        className
      ].filter(Boolean).join(" ")}
      data-testid={testId}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>count(logs)</span>
        <span className="text-slate-300">{getTimeRangeLabel()}</span>
      </div>
      
      <div className="w-full">
        <div style={{ width: '100%', height: 220 }}>
          <ReactECharts
            key={`chart-${selected.slug}-${range}-${customRange?.label || ''}`}
            echarts={echarts as any}
            style={{ width: '100%', height: 220, cursor: 'crosshair' }}
            option={{
              legend: { 
                data: ['error', 'warning', 'info'], 
                textStyle: { color: '#cbd5e1' }, 
                top: 0, 
                selected: legendSel 
              },
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
                ...(timeSel ? {} : {
                  min: new Date(Date.now() - (customRange ? 
                    (customRange.unit === 'm' ? customRange.value * 60 * 1000 :
                     customRange.unit === 'h' ? customRange.value * 60 * 60 * 1000 :
                     customRange.unit === 'd' ? customRange.value * 24 * 60 * 60 * 1000 :
                     customRange.unit === 'w' ? customRange.value * 7 * 24 * 60 * 60 * 1000 : 86400000)
                    : (range === '1h' ? 60 : range === '24h' ? 1440 : range === '7d' ? 10080 : range === '14d' ? 20160 : range === '30d' ? 43200 : range === '90d' ? 129600 : 525600) * 60 * 1000)).getTime(),
                  max: new Date().getTime()
                })
              },
              yAxis: { 
                type: 'value', 
                min: 0, 
                axisLabel: { color: '#94a3b8' }, 
                splitLine: { lineStyle: { color: '#64748b', opacity: 0.25, type: 'dashed' } } 
              },
              dataZoom: [
                Object.assign(
                  { type: 'inside', zoomOnMouseWheel: true, moveOnMouseWheel: false, moveOnMouseMove: false }, 
                  (zoomStart != null && zoomEnd != null) ? { startValue: zoomStart, endValue: zoomEnd } : { start: 0, end: 100 }
                )
              ],
              brush: { xAxisIndex: 0, brushType: 'lineX', brushMode: 'single', transformable: false, throttleType: 'debounce', throttleDelay: 120 },
              series: [
                { name: 'error', type: 'bar', stack: 'total', barMaxWidth: 28, itemStyle: { color: '#ef4444' }, data: chartData.map(r => [r.timestamp, r.error]) },
                { name: 'warning', type: 'bar', stack: 'total', barMaxWidth: 28, itemStyle: { color: '#f59e0b' }, data: chartData.map(r => [r.timestamp, r.warning]) },
                { name: 'info', type: 'bar', stack: 'total', barMaxWidth: 28, itemStyle: { color: '#60a5fa' }, data: chartData.map(r => [r.timestamp, r.info]) },
              ],
            }}
            onChartReady={handleChartReady}
            onEvents={{
              click: handleChartClick,
              brushEnd: handleBrushEnd,
              legendselectchanged: handleLegendChange,
            }}
          />
        </div>
      </div>
      
      <div className="mt-2 text-xs text-slate-400">
        Tip: Use the chart zoom to filter time range (logs and dashboard sync).
      </div>
    </div>
  )
}