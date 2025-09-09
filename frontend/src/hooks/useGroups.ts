// Custom hook for group (issue) management

import { useState, useEffect, useCallback } from 'react'
import { Group, Project } from '../types/domain.types'
import { GroupService, GroupAdapter } from '../services'

export const useGroups = (project: Project | null) => {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load groups from API
  const loadGroups = useCallback(async (filters?: {
    level?: string
    status?: string
    limit?: number
  }) => {
    if (!project) {
      setGroups([])
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const params = {
        project: project.slug,
        ...filters
      }
      
      const apiGroups = await GroupService.getAll(params)
      const domainGroups = GroupAdapter.fromAPIList(apiGroups)
      setGroups(domainGroups)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load groups'
      setError(message)
      console.error('Error loading groups:', err)
    } finally {
      setIsLoading(false)
    }
  }, [project])

  // Update group status or assignment
  const updateGroup = useCallback(async (
    groupId: number, 
    action: 'resolve' | 'unresolve' | 'ignore' | 'assign',
    value?: string
  ) => {
    setError(null)
    
    try {
      let updatedGroup: Group
      
      switch (action) {
        case 'resolve':
          const resolvedAPI = await GroupService.resolve(groupId, value)
          updatedGroup = GroupAdapter.fromAPI(resolvedAPI)
          break
        case 'unresolve':
          const unresolvedAPI = await GroupService.unresolve(groupId, value)
          updatedGroup = GroupAdapter.fromAPI(unresolvedAPI)
          break
        case 'ignore':
          const ignoredAPI = await GroupService.ignore(groupId, value)
          updatedGroup = GroupAdapter.fromAPI(ignoredAPI)
          break
        case 'assign':
          if (!value) throw new Error('Assignee value required')
          const assignedAPI = await GroupService.assign(groupId, value)
          updatedGroup = GroupAdapter.fromAPI(assignedAPI)
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }
      
      // Update local state
      setGroups(prev => 
        prev.map(group => 
          group.id === groupId ? updatedGroup : group
        )
      )
      
      return updatedGroup
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${action} group`
      setError(message)
      throw new Error(message)
    }
  }, [])

  // Add comment to group
  const addComment = useCallback(async (groupId: number, comment: string) => {
    setError(null)
    
    try {
      await GroupService.addComment(groupId, comment)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add comment'
      setError(message)
      throw new Error(message)
    }
  }, [])

  // Delete group
  const deleteGroup = useCallback(async (groupId: number) => {
    setError(null)
    
    try {
      await GroupService.delete(groupId)
      setGroups(prev => prev.filter(group => group.id !== groupId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete group'
      setError(message)
      throw new Error(message)
    }
  }, [])

  // Reload groups
  const reloadGroups = useCallback((filters?: { level?: string; status?: string }) => {
    return loadGroups(filters)
  }, [loadGroups])

  // Load groups when project changes
  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  return {
    groups,
    isLoading,
    error,
    reloadGroups,
    updateGroup,
    addComment,
    deleteGroup
  }
}