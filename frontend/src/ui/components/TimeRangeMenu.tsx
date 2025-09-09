import { useState, useCallback } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'

type TimeRange = '1h'|'24h'|'7d'|'14d'|'30d'|'90d'|'1y'

type CustomRangeType = {
  value: number
  unit: string
  label: string
}

interface TimeRangeMenuProps {
  range: TimeRange
  setRange: (range: TimeRange) => void
  setInterval: (interval: string) => void
  setTimeSel: (timeSel: any) => void
  onCustomRange?: (customRange: CustomRangeType | null) => void
  className?: string
  testId?: string
}

export const TimeRangeMenu = ({ 
  range, 
  setRange, 
  setInterval, 
  setTimeSel, 
  onCustomRange,
  className,
  testId = 'time-range-menu'
}: TimeRangeMenuProps) => {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [customRange, setCustomRange] = useState<CustomRangeType | null>(null)
  
  const applyRelative = useCallback((r: TimeRange) => {
    setRange(r)
    const intervalMap: Record<TimeRange, string> = {
      '1h': '1m',
      '24h': '1h', 
      '7d': '1h',
      '14d': '1h',
      '30d': '24h',
      '90d': '24h',
      '1y': '24h'
    }
    setInterval(intervalMap[r])
    setTimeSel(null)
    setCustomRange(null)
    onCustomRange?.(null)
    setOpen(false)
  }, [setRange, setInterval, setTimeSel, onCustomRange])
  
  const parseCustomInput = useCallback((s: string): CustomRangeType | null => {
    let maxMs = 0
    let bestMatch: {value: number; unit: string; label: string} | null = null
    
    s.split(/[\,\s]+/).forEach(tok => {
      const m = tok.trim().match(/^(\d+)([mhdw])$/i)
      if (!m) return
      const value = parseInt(m[1], 10)
      const unit = m[2].toLowerCase()
      
      // Convert to milliseconds and validate limits
      let ms = 0
      let validRange = false
      let displayUnit = ''
      let pluralUnit = ''
      
      if (unit === 'm' && value <= 60) {
        ms = value * 60 * 1000
        validRange = true
        displayUnit = 'minute'
        pluralUnit = 'minutes'
      } else if (unit === 'h' && value <= 24) {
        ms = value * 60 * 60 * 1000
        validRange = true
        displayUnit = 'hour'
        pluralUnit = 'hours'
      } else if (unit === 'd' && value <= 365) {
        ms = value * 24 * 60 * 60 * 1000
        validRange = true
        displayUnit = 'day'
        pluralUnit = 'days'
      } else if (unit === 'w' && value <= 52) {
        ms = value * 7 * 24 * 60 * 60 * 1000
        validRange = true
        displayUnit = 'week'
        pluralUnit = 'weeks'
      }
      
      if (validRange && ms > maxMs) {
        maxMs = ms
        const label = value === 1 ? `Last ${displayUnit}` : `Last ${value} ${pluralUnit}`
        bestMatch = { value, unit, label }
      }
    })
    
    return bestMatch
  }, [])

  const applyCustomRange = useCallback((customRangeToApply: CustomRangeType) => {
    const value = customRangeToApply.value
    const unit = customRangeToApply.unit
    const ms = unit === 'm' ? value * 60 * 1000 :
               unit === 'h' ? value * 60 * 60 * 1000 :
               unit === 'd' ? value * 24 * 60 * 60 * 1000 :
               unit === 'w' ? value * 7 * 24 * 60 * 60 * 1000 : 0

    // Set appropriate interval based on time range
    const interval = ms <= 60*60*1000 ? '1m' :       // <= 1 hour: 1m
                   ms <= 24*60*60*1000 ? '1h' :      // <= 1 day: 1h  
                   '24h'                              // > 1 day: 24h
    
    setRange('24h')
    setInterval(interval)
    setCustomRange(customRangeToApply)
    onCustomRange?.(customRangeToApply)
    setTimeSel(null)
    setCustom('')
    setOpen(false)
  }, [setRange, setInterval, setTimeSel, onCustomRange])
  
  const parsedCustom = custom.trim() ? parseCustomInput(custom) : null
  
  const getRangeLabel = useCallback((currentRange: TimeRange): string => {
    const labelMap: Record<TimeRange, string> = {
      '1h': '1H',
      '24h': '24H',
      '7d': '7D',
      '14d': '14D',
      '30d': '30D',
      '90d': '90D',
      '1y': '1Y'
    }
    return labelMap[currentRange]
  }, [])
  
  const label = customRange ? customRange.label : getRangeLabel(range)

  const handleToggleOpen = useCallback(() => {
    setOpen(prev => !prev)
  }, [])

  const handleCustomInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCustom(e.target.value)
  }, [])

  const handleCustomRangeApply = useCallback(() => {
    if (parsedCustom) {
      applyCustomRange(parsedCustom)
    }
  }, [parsedCustom, applyCustomRange])
  
  return (
    <div 
      className={["relative", className].filter(Boolean).join(" ")} 
      data-testid={testId}
    >
      <button 
        type="button"
        className="rounded border border-slate-700 bg-transparent px-2 py-1 text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
        onClick={handleToggleOpen}
        data-testid="time-range-button"
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-56 rounded-md border border-slate-700 bg-slate-900 p-2 text-sm shadow" data-testid="time-range-dropdown">
          <div className="mb-2 text-[11px] text-slate-400">Filter Time Range</div>
          <input 
            type="text"
            className="mb-2 w-full rounded border border-slate-700 bg-transparent px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Custom range: 30m, 2h, 4d, 3w" 
            value={custom} 
            onChange={handleCustomInputChange}
            data-testid="custom-range-input"
            autoComplete="off"
          />
          <ul className="space-y-1">
            {parsedCustom && (
              <li>
                <button 
                  type="button"
                  className="w-full rounded px-2 py-1 text-left bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  onClick={handleCustomRangeApply}
                  data-testid="custom-range-apply"
                >
                  {parsedCustom.label}
                </button>
              </li>
            )}
            <li>
              <button 
                type="button"
                className="w-full rounded px-2 py-1 text-left text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                onClick={() => applyRelative('1h')}
                data-testid="range-1h"
              >
                Last hour
              </button>
            </li>
            <li>
              <button 
                type="button"
                className="w-full rounded px-2 py-1 text-left text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                onClick={() => applyRelative('24h')}
                data-testid="range-24h"
              >
                Last 24 hours
              </button>
            </li>
            <li>
              <button 
                type="button"
                className="w-full rounded px-2 py-1 text-left text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                onClick={() => applyRelative('7d')}
                data-testid="range-7d"
              >
                Last 7 days
              </button>
            </li>
            <li>
              <button 
                type="button"
                className="w-full rounded px-2 py-1 text-left text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                onClick={() => applyRelative('14d')}
                data-testid="range-14d"
              >
                Last 14 days
              </button>
            </li>
            <li>
              <button 
                type="button"
                className="w-full rounded px-2 py-1 text-left text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                onClick={() => applyRelative('30d')}
                data-testid="range-30d"
              >
                Last 30 days
              </button>
            </li>
            <li>
              <button 
                type="button"
                className="w-full rounded px-2 py-1 text-left text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                onClick={() => { /* Absolute date could open a date picker */ }}
                data-testid="range-absolute"
              >
                Absolute date →
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}