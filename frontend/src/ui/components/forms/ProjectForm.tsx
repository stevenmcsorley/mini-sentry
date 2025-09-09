import React, { useState, useCallback } from 'react'

interface ProjectFormProps {
  onCreate: (name: string) => Promise<void> | void
  isLoading?: boolean
  testId?: string
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ 
  onCreate, 
  isLoading = false,
  testId = 'project-form' 
}) => {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!name.trim() || isLoading || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      await onCreate(name.trim())
      setName('') // Clear form on success
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [name, onCreate, isLoading, isSubmitting])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }, [handleSubmit])

  const disabled = !name.trim() || isLoading || isSubmitting

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex gap-2 mb-3"
      data-testid={testId}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter project name"
        className="flex-1 px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading || isSubmitting}
        data-testid="project-name-input"
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
        data-testid="create-project-button"
      >
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}