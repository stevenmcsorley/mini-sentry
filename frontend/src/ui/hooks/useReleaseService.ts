import { useCallback } from 'react'
import type { Project, Release, TimeRange, TimeInterval } from '../types/app.types'
import { api } from '../utils/api.utils'

interface UseReleaseServiceParams {
  selected: Project | null
  releases: Release[]
  sessionUser: string
  range: TimeRange
  interval: TimeInterval
  onRefetch: () => void
}

export const useReleaseService = ({ 
  selected, 
  releases, 
  sessionUser, 
  range, 
  interval, 
  onRefetch 
}: UseReleaseServiceParams) => {
  const createRelease = useCallback(async (version: string, environment: string) => {
    if (!selected) return
    
    await api('/api/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: selected.id, version, environment }),
    })
    
    onRefetch()
  }, [selected, onRefetch])

  const createDeployment = useCallback(async (name: string, url: string, environment: string, releaseId?: number) => {
    if (!selected) return
    if (!releaseId && releases.length === 0) return
    
    const rid = releaseId || releases[0].id
    await api('/api/deployments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        project: selected.id, 
        release: rid, 
        name, 
        url, 
        environment 
      })
    })
    
    onRefetch()
  }, [selected, releases, onRefetch])

  const sendSession = useCallback(async (status: 'init'|'ok'|'errored'|'crashed'|'exited') => {
    if (!selected) return
    
    const sessionId = Math.random().toString(36).slice(2)
    await api(`/api/sessions/ingest/token/${selected.ingest_token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        session_id: sessionId, 
        status, 
        user: sessionUser, 
        release: releases[0]?.version || '1.0.0', 
        environment: 'production', 
        duration_ms: status === 'ok' ? 1200 : 0 
      })
    })
    
    onRefetch()
  }, [selected, sessionUser, releases, onRefetch])

  return {
    createRelease,
    createDeployment,
    sendSession
  }
}