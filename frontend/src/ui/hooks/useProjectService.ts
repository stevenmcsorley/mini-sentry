import { useCallback } from 'react'
import type { Project } from '../types/app.types'
import { api } from '../utils/api.utils'

interface UseProjectServiceParams {
  onProjectCreated: (project: Project) => void
  onReload: () => Promise<void>
}

export const useProjectService = ({ onProjectCreated, onReload }: UseProjectServiceParams) => {
  const createProject = useCallback(async (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const created = await api('/api/projects/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })
    await onReload()
    if (created && created.id) {
      onProjectCreated(created)
    }
  }, [onProjectCreated, onReload])

  return {
    createProject
  }
}