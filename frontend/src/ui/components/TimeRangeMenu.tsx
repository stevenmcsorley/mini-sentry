import React, { useState } from 'react'

interface TimeRangeMenuProps {
  range: '1h'|'24h'|'7d'|'14d'|'30d'|'90d'|'1y'
  setRange: any
  setInterval: any
  setTimeSel: any
  onCustomRange?: (customRange: {value: number; unit: string; label: string} | null) => void
}

export function TimeRangeMenu({ range, setRange, setInterval, setTimeSel, onCustomRange }: TimeRangeMenuProps) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [customRange, setCustomRange] = useState<{value: number; unit: string; label: string} | null>(null)
  
  const applyRelative = (r: string) => {
    setRange(r)
    setInterval(r==='1h'?'1m':r==='24h'?'1h':r==='7d'?'1h':r==='14d'?'1h':r==='30d'?'24h':r==='90d'?'24h':'24h')
    setTimeSel(null) // Clear any specific time selection - show full range
    setCustomRange(null) // Clear custom range when using preset
    onCustomRange?.(null) // Notify parent
    setOpen(false)
  }
  
  // Parse custom input and return the best match without applying it
  const parseCustomInput = (s: string): {value: number; unit: string; label: string} | null => {
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
  }

  // Apply the custom range
  const applyCustomRange = (customRange: {value: number; unit: string; label: string}) => {
    const value = customRange.value
    const unit = customRange.unit
    const ms = unit === 'm' ? value * 60 * 1000 :
               unit === 'h' ? value * 60 * 60 * 1000 :
               unit === 'd' ? value * 24 * 60 * 60 * 1000 :
               unit === 'w' ? value * 7 * 24 * 60 * 60 * 1000 : 0

    // Set appropriate interval based on time range
    const interval = ms <= 60*60*1000 ? '1m' :       // <= 1 hour: 1m
                   ms <= 24*60*60*1000 ? '1h' :      // <= 1 day: 1h  
                   '24h'                              // > 1 day: 24h
    
    setRange('24h') // Use 24h as base, but we'll override with custom display
    setInterval(interval)
    setCustomRange(customRange)
    onCustomRange?.(customRange) // Notify parent
    setTimeSel(null) // Clear any specific time selection - show full range
    setCustom('') // Clear the input field
    setOpen(false)
  }
  
  // Get the parsed custom range from current input
  const parsedCustom = custom.trim() ? parseCustomInput(custom) : null
  const label = customRange ? customRange.label : (range==='1h'?'1H':range==='24h'?'24H':range==='7d'?'7D':range==='14d'?'14D':range==='30d'?'30D':range==='90d'?'90D':'1Y')
  
  return (
    <div className="relative" data-testid="time-range-menu">
      <button 
        className="rounded border border-slate-700 bg-transparent px-2 py-1" 
        onClick={()=>setOpen(v=>!v)}
        data-testid="time-range-button"
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-56 rounded-md border border-slate-700 bg-slate-900 p-2 text-sm shadow" data-testid="time-range-dropdown">
          <div className="mb-2 text-[11px] text-slate-400">Filter Time Range</div>
          <input 
            className="mb-2 w-full rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
            placeholder="Custom range: 30m, 2h, 4d, 3w" 
            value={custom} 
            onChange={e=>setCustom(e.target.value)}
            data-testid="custom-range-input"
          />
          <ul className="space-y-1">
            {parsedCustom && (
              <li>
                <button 
                  className="w-full rounded px-2 py-1 text-left bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30" 
                  onClick={()=>applyCustomRange(parsedCustom)}
                  data-testid="custom-range-apply"
                >
                  {parsedCustom.label}
                </button>
              </li>
            )}
            <li>
              <button 
                className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" 
                onClick={()=>applyRelative('1h')}
                data-testid="range-1h"
              >
                Last hour
              </button>
            </li>
            <li>
              <button 
                className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" 
                onClick={()=>applyRelative('24h')}
                data-testid="range-24h"
              >
                Last 24 hours
              </button>
            </li>
            <li>
              <button 
                className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" 
                onClick={()=>applyRelative('7d')}
                data-testid="range-7d"
              >
                Last 7 days
              </button>
            </li>
            <li>
              <button 
                className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" 
                onClick={()=>applyRelative('14d')}
                data-testid="range-14d"
              >
                Last 14 days
              </button>
            </li>
            <li>
              <button 
                className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" 
                onClick={()=>applyRelative('30d')}
                data-testid="range-30d"
              >
                Last 30 days
              </button>
            </li>
            <li>
              <button 
                className="w-full rounded px-2 py-1 text-left hover:bg-slate-800/60" 
                onClick={()=>{ /* Absolute date could open a date picker */ }}
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