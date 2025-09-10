import { useState, useEffect } from 'react'
import type { Project } from '../types/app.types'
import { api } from '../utils/api.utils'

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    setLoading(true)
    setError(null)
    
    // Add a small delay to avoid race conditions
    const timeoutId = setTimeout(() => {
      api('/api/projects/').then((d) => {
        if (Array.isArray(d)) setProjects(d)
        else if (d && d.results) setProjects(d.results)
        else setProjects([])
        setError(null)
      }).catch((err) => {
        console.error('Failed to load projects:', err)
        setError(err.message || 'Failed to load projects')
        setProjects([])
      }).finally(() => {
        setLoading(false)
      })
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [])
  
  const reload = () => {
    setLoading(true)
    setError(null)
    
    return api('/api/projects/').then((d) => {
      if (Array.isArray(d)) setProjects(d)
      else if (d && d.results) setProjects(d.results)
      else setProjects([])
      setError(null)
      return d
    }).catch((err) => {
      console.error('Failed to reload projects:', err)
      setError(err.message || 'Failed to reload projects')
      setProjects([])
      throw err
    }).finally(() => {
      setLoading(false)
    })
  }
  
  return { projects, reload, loading, error }
}