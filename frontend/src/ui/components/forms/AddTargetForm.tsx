import { useState, useCallback } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

interface AddTargetFormProps {
  ruleId: number
  onAdded: () => void
  isLoading?: boolean
  className?: string
  testId?: string
}

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(path, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const AddTargetForm = ({ 
  ruleId, 
  onAdded,
  isLoading = false,
  className,
  testId = 'add-target-form'
}: AddTargetFormProps) => {
  const [type, setType] = useState<'email'|'webhook'>('email')
  const [value, setValue] = useState('alerts@example.test')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = useCallback(async (e?: FormEvent) => {
    if (e) e.preventDefault()
    
    if (!value.trim() || isLoading || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      await api(`/api/alert-rules/${ruleId}/targets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target_type: type, 
          target_value: value.trim(), 
          subject_template: subject.trim(), 
          body_template: body.trim() 
        })
      })
      setValue(type === 'email' ? 'alerts@example.test' : '')
      setSubject('')
      setBody('')
      onAdded()
    } catch (error) {
      console.error('Failed to add target:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [type, value, subject, body, ruleId, onAdded, isLoading, isSubmitting])

  const handleTypeChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'email' | 'webhook'
    setType(newType)
    setValue(newType === 'email' ? 'alerts@example.test' : '')
  }, [])

  const handleValueChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }, [])

  const handleSubjectChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSubject(e.target.value)
  }, [])

  const handleBodyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setBody(e.target.value)
  }, [])
  
  const disabled = !value.trim() || isLoading || isSubmitting
  
  return (
    <form 
      onSubmit={handleSubmit}
      className={["flex gap-2 my-2", className].filter(Boolean).join(" ")} 
      data-testid={testId}
    >
      <select 
        value={type} 
        onChange={handleTypeChange} 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading || isSubmitting}
        data-testid="target-type-select"
      >
        <option value='email'>email</option>
        <option value='webhook'>webhook</option>
      </select>
      <input 
        type={type === 'email' ? 'email' : 'url'}
        value={value} 
        onChange={handleValueChange} 
        placeholder={type === 'email' ? 'alerts@example.com' : 'https://webhook-url.com/alerts'} 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 220 }}
        disabled={isLoading || isSubmitting}
        data-testid="target-value-input"
        autoComplete="off"
      />
      <input 
        type="text"
        value={subject} 
        onChange={handleSubjectChange} 
        placeholder='subject template (optional)' 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 220 }}
        disabled={isLoading || isSubmitting}
        data-testid="subject-template-input"
        autoComplete="off"
      />
      <input 
        type="text"
        value={body} 
        onChange={handleBodyChange} 
        placeholder='body template (optional)' 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 260 }}
        disabled={isLoading || isSubmitting}
        data-testid="body-template-input"
        autoComplete="off"
      />
      <button 
        type="submit"
        disabled={disabled}
        className={`px-4 py-2 rounded font-medium transition-colors ${
          disabled 
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
            : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500'
        }`}
        data-testid="add-target-button"
      >
        {isSubmitting ? 'Adding...' : 'Add target'}
      </button>
    </form>
  )
}