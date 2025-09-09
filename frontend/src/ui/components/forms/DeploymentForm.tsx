import { useState, useCallback } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

interface DeploymentFormProps {
  onCreate: (name: string, url: string, env: string, releaseId?: number) => Promise<void> | void
  isLoading?: boolean
  className?: string
  testId?: string
}

export const DeploymentForm = ({ 
  onCreate, 
  isLoading = false,
  className,
  testId = 'deployment-form'
}: DeploymentFormProps) => {
  const [name, setName] = useState('Deploy #1')
  const [url, setUrl] = useState('https://example.com')
  const [env, setEnv] = useState('production')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = useCallback(async (e?: FormEvent) => {
    if (e) e.preventDefault()
    
    if (!name.trim() || !url.trim() || !env.trim() || isLoading || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      await onCreate(name.trim(), url.trim(), env.trim())
      setName('Deploy #1')
      setUrl('https://example.com')
      setEnv('production')
    } catch (error) {
      console.error('Failed to create deployment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [name, url, env, onCreate, isLoading, isSubmitting])

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const handleUrlChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }, [])

  const handleEnvChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEnv(e.target.value)
  }, [])
  
  const disabled = !name.trim() || !url.trim() || !env.trim() || isLoading || isSubmitting
  
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
        placeholder="Name" 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 180 }}
        disabled={isLoading || isSubmitting}
        data-testid="deployment-name-input"
        autoComplete="off"
      />
      <input 
        type="url"
        value={url} 
        onChange={handleUrlChange} 
        placeholder="URL" 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 240 }}
        disabled={isLoading || isSubmitting}
        data-testid="deployment-url-input"
        autoComplete="off"
      />
      <input 
        type="text"
        value={env} 
        onChange={handleEnvChange} 
        placeholder="Environment" 
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 140 }}
        disabled={isLoading || isSubmitting}
        data-testid="deployment-environment-input"
        autoComplete="off"
      />
      <button 
        type="submit"
        disabled={disabled}
        className={`px-4 py-2 rounded font-medium transition-colors ${
          disabled 
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
        }`}
        data-testid="create-deployment-button"
      >
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}