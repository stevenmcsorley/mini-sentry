// Custom hook for project management

import { useState, useEffect, useCallback } from 'react'
import { Project } from '../types/domain.types'
import { ProjectService, ProjectAdapter } from '../services'

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load projects from API
  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const apiProjects = await ProjectService.getAll()
      const domainProjects = ProjectAdapter.fromAPIList(apiProjects)
      setProjects(domainProjects)
      
      // Auto-select from localStorage or first project
      const savedProjectId = localStorage.getItem('selectedProjectId')
      if (savedProjectId) {
        const savedProject = domainProjects.find(p => p.id === parseInt(savedProjectId))
        if (savedProject) {
          setSelectedProject(savedProject)
          return
        }
      }
      
      // Fallback to first project
      if (domainProjects.length > 0 && !selectedProject) {
        setSelectedProject(domainProjects[0])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects'
      setError(message)
      console.error('Error loading projects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedProject])

  // Select project and persist to localStorage
  const selectProject = useCallback((project: Project) => {
    setSelectedProject(project)
    localStorage.setItem('selectedProjectId', project.id.toString())
  }, [])

  // Create new project
  const createProject = useCallback(async (name: string) => {
    setError(null)
    
    try {
      const createRequest = ProjectAdapter.toCreateRequest(name)
      const apiProject = await ProjectService.create(createRequest)
      const domainProject = ProjectAdapter.fromAPI(apiProject)
      
      setProjects(prev => [...prev, domainProject])
      setSelectedProject(domainProject)
      localStorage.setItem('selectedProjectId', domainProject.id.toString())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      setError(message)
      throw new Error(message)
    }
  }, [])

  // Reload projects
  const reloadProjects = useCallback(() => {
    return loadProjects()
  }, [loadProjects])

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return {
    projects,
    selectedProject,
    isLoading,
    error,
    selectProject,
    createProject,
    reloadProjects
  }
}