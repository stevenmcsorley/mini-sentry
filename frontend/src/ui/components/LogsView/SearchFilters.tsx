import type { ChangeEvent } from 'react'
import type { SearchToken, TimeSelection } from '../../types/app.types'

interface SearchFiltersProps {
  filterLevel: string
  onLevelChange: (e: ChangeEvent<HTMLSelectElement>) => void
  timeSel: TimeSelection | null
  onRemoveTimeFilter: () => void
  tokens: SearchToken[]
  onRemoveToken: (tokenRaw: string) => void
  onClearAll: () => void
  className?: string
  testId?: string
}

export const SearchFilters = ({
  filterLevel,
  onLevelChange,
  timeSel,
  onRemoveTimeFilter,
  tokens,
  onRemoveToken,
  onClearAll,
  className,
  testId = 'search-filters'
}: SearchFiltersProps) => {
  return (
    <div 
      className={[
        "mt-3 flex flex-wrap items-center gap-2",
        className
      ].filter(Boolean).join(" ")}
      data-testid={testId}
    >
      <select 
        value={filterLevel} 
        onChange={onLevelChange}
        className="rounded-full border border-slate-700 bg-slate-800 text-white px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        data-testid="severity-filter"
      >
        <option value="">severity:any</option>
        <option value="error">severity:error</option>
        <option value="warning">severity:warning</option>
        <option value="info">severity:info</option>
      </select>
      
      {timeSel && (
        <span 
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-white"
          data-testid="time-filter-badge"
        >
          time: {new Date(timeSel.from).toLocaleString()} – {new Date(timeSel.to).toLocaleString()}
          <button 
            type="button"
            className="text-slate-400 hover:text-slate-200 focus:outline-none"
            onClick={onRemoveTimeFilter}
            data-testid="remove-time-filter"
          >
            ×
          </button>
        </span>
      )}
      
      {tokens.map((t, i) => (
        <span 
          key={i} 
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-white"
          data-testid={`search-token-${i}`}
        >
          {t.key ? `${t.key}:` : ''}{t.value}
          <button 
            type="button"
            className="text-slate-400 hover:text-slate-200 focus:outline-none"
            onClick={() => onRemoveToken(t.raw)}
            data-testid={`remove-token-${i}`}
          >
            ×
          </button>
        </span>
      ))}
      
      <button 
        type="button"
        className="rounded-full border border-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
        onClick={onClearAll}
        data-testid="clear-filters-button"
      >
        See full list
      </button>
    </div>
  )
}