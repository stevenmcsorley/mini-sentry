import { useState, useEffect } from 'react'
import type { Project } from '../types/app.types'
import { api } from '../utils/api.utils'

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  
  useEffect(() => {
    api('/api/projects/').then((d) => {
      if (Array.isArray(d)) setProjects(d)
      else if (d && d.results) setProjects(d.results)
      else setProjects([])
    }).catch(console.error)
  }, [])
  
  const reload = () => api('/api/projects/').then((d) => {
    if (Array.isArray(d)) setProjects(d)
    else if (d && d.results) setProjects(d.results)
    else setProjects([])
  })
  
  return { projects, reload }
}