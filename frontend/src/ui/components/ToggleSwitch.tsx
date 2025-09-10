import { useCallback } from 'react'

interface ToggleSwitchProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  label?: string
  className?: string
  testId?: string
}

export const ToggleSwitch = ({ 
  enabled, 
  onToggle, 
  label, 
  className,
  testId = 'toggle-switch' 
}: ToggleSwitchProps) => {
  const handleClick = useCallback(() => {
    onToggle(!enabled)
  }, [enabled, onToggle])

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {label && (
        <label 
          htmlFor={testId}
          className="text-sm text-slate-300 cursor-pointer"
        >
          {label}
        </label>
      )}
      <button
        id={testId}
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleClick}
        data-testid={testId}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
          ${enabled ? 'bg-blue-600' : 'bg-slate-700'}
        `}
      >
        <span className="sr-only">Toggle {label || 'setting'}</span>
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {enabled && (
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400">LIVE</span>
        </div>
      )}
    </div>
  )
}