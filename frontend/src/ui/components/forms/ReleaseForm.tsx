import { useState, useCallback } from 'react'
import type { FormEvent, ChangeEvent } from 'react'

interface ReleaseFormProps {
  onCreate: (version: string, environment: string) => Promise<void> | void
  isLoading?: boolean
  className?: string
  testId?: string
}

export const ReleaseForm = ({ 
  onCreate, 
  isLoading = false,
  className,
  testId = 'release-form' 
}: ReleaseFormProps) => {
  const [version, setVersion] = useState('')
  const [environment, setEnvironment] = useState('production')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    if (e) e.preventDefault()
    
    if (!version.trim() || !environment.trim() || isLoading || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      await onCreate(version.trim(), environment.trim())
      setVersion('') // Clear version on success
    } catch (error) {
      console.error('Failed to create release:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [version, environment, onCreate, isLoading, isSubmitting])

  const handleVersionChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setVersion(e.target.value)
  }, [])

  const handleEnvironmentChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setEnvironment(e.target.value)
  }, [])

  const disabled = !version.trim() || !environment.trim() || isLoading || isSubmitting

  return (
    <form 
      onSubmit={handleSubmit}
      className={["flex gap-2 my-2", className].filter(Boolean).join(" ")}
      data-testid={testId}
    >
      <input
        type="text"
        value={version}
        onChange={handleVersionChange}
        placeholder="e.g., 1.2.3"
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading || isSubmitting}
        data-testid="release-version-input"
        autoComplete="off"
      />
      <select
        value={environment}
        onChange={handleEnvironmentChange}
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading || isSubmitting}
        data-testid="release-environment-select"
      >
        <option value="production">Production</option>
        <option value="staging">Staging</option>
        <option value="development">Development</option>
        <option value="testing">Testing</option>
      </select>
      <button
        type="submit"
        disabled={disabled}
        className={`px-4 py-2 rounded font-medium transition-colors ${
          disabled 
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
            : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
        }`}
        data-testid="create-release-button"
      >
        {isSubmitting ? 'Creating...' : 'Create Release'}
      </button>
    </form>
  )
}