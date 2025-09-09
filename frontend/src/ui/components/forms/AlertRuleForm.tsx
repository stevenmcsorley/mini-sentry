import { useState, useCallback } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

interface AlertRuleFormProps {
  onCreate: (name: string, level: string, threshold: number, targetType: 'email'|'webhook', targetValue: string) => Promise<void> | void
  isLoading?: boolean
  className?: string
  testId?: string
}

export const AlertRuleForm = ({ 
  onCreate,
  isLoading = false,
  className,
  testId = 'alert-rule-form'
}: AlertRuleFormProps) => {
  const [name, setName] = useState('High error volume')
  const [level, setLevel] = useState('error')
  const [threshold, setThreshold] = useState(10)
  const [targetType, setTargetType] = useState<'email'|'webhook'>('email')
  const [targetValue, setTargetValue] = useState('alerts@example.test')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = useCallback(async (e?: FormEvent) => {
    if (e) e.preventDefault()
    
    if (!name.trim() || !targetValue.trim() || threshold <= 0 || isLoading || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      await onCreate(name.trim(), level.trim(), threshold, targetType, targetValue.trim())
      setName('High error volume')
      setLevel('error')
      setThreshold(10)
      setTargetType('email')
      setTargetValue('alerts@example.test')
    } catch (error) {
      console.error('Failed to create alert rule:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [name, level, threshold, targetType, targetValue, onCreate, isLoading, isSubmitting])

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const handleLevelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLevel(e.target.value)
  }, [])

  const handleThresholdChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setThreshold(parseInt(e.target.value) || 0)
  }, [])

  const handleTargetTypeChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'email' | 'webhook'
    setTargetType(newType)
    setTargetValue(newType === 'email' ? 'alerts@example.test' : 'https://your-webhook-url.com/alerts')
  }, [])

  const handleTargetValueChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTargetValue(e.target.value)
  }, [])
  
  const disabled = !name.trim() || !targetValue.trim() || threshold <= 0 || isLoading || isSubmitting
  
  return (
    <form 
      onSubmit={handleSubmit}
      className={["flex gap-2 my-2", className].filter(Boolean).join(" ")}
      data-testid={testId}
    >
      <input 
        type="text"
        value={name} 
        onChange={handleNameChange} 
        placeholder="Rule name" 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 180 }}
        disabled={isLoading || isSubmitting}
        data-testid="alert-rule-name-input"
        autoComplete="off"
      />
      <input 
        type="text"
        value={level} 
        onChange={handleLevelChange} 
        placeholder="Level (blank=any)" 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 140 }}
        disabled={isLoading || isSubmitting}
        data-testid="alert-rule-level-input"
        autoComplete="off"
      />
      <input 
        type="number" 
        value={threshold} 
        onChange={handleThresholdChange} 
        min="1"
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 100 }}
        disabled={isLoading || isSubmitting}
        data-testid="alert-rule-threshold-input"
      />
      <select 
        value={targetType} 
        onChange={handleTargetTypeChange} 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading || isSubmitting}
        data-testid="alert-target-type-select"
      >
        <option value="email">email</option>
        <option value="webhook">webhook</option>
      </select>
      <input 
        type={targetType === 'email' ? 'email' : 'url'}
        value={targetValue} 
        onChange={handleTargetValueChange} 
        placeholder={targetType === 'email' ? 'alerts@example.com' : 'https://webhook-url.com/alerts'} 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 240 }}
        disabled={isLoading || isSubmitting}
        data-testid="alert-target-input"
        autoComplete="off"
      />
      <button 
        type="submit"
        disabled={disabled}
        className={`px-4 py-2 rounded font-medium transition-colors ${
          disabled 
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
            : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
        }`}
        data-testid="create-alert-rule-button"
      >
        {isSubmitting ? 'Creating...' : 'Add'}
      </button>
    </form>
  )
}