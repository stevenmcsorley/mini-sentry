import { useCallback } from 'react'
import type { Project, Release, EventDetails } from '../types/app.types'
import { api } from '../utils/api.utils'

interface UseEventServiceParams {
  selected: Project | null
  msg: string
  releases: Release[]
  onRefetch: () => void
  onEventDetailsUpdate: (id: number, details: any) => void
}

export const useEventService = ({ 
  selected, 
  msg, 
  releases, 
  onRefetch, 
  onEventDetailsUpdate 
}: UseEventServiceParams) => {
  const sendEvent = useCallback(async () => {
    if (!selected) return
    
    await api(`/api/events/ingest/token/${selected.ingest_token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: msg, 
        level: 'error', 
        ui: true, 
        tags: [{ source: 'ui' }] 
      }),
    })
    
    setTimeout(() => {
      onRefetch()
    }, 500)
  }, [selected, msg, onRefetch])

  const fetchEvent = useCallback(async (id: number) => {
    try {
      const d = await api(`/api/events/${id}`)
      let symSource: 'stored' | 'live' | undefined
      
      if (d.symbolicated?.frames?.length) symSource = 'stored'
      
      if ((!d.symbolicated || !d.symbolicated.frames || d.symbolicated.frames.length === 0) && 
          d.stack && d.release && selected) {
        const relObj = releases.find(r => r.id === d.release)
        if (relObj) {
          try {
            const sym = await api(`/api/symbolicate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project: selected.slug,
                release: relObj.version,
                environment: relObj.environment,
                stack: d.stack,
              })
            })
            d.symbolicated = { frames: sym.frames }
            symSource = 'live'
          } catch {}
        }
      }
      
      if (symSource) (d as any)._symSource = symSource
      onEventDetailsUpdate(id, d)
    } catch (error) {
      // Handle API errors gracefully - don't throw, just log
      console.error(`Failed to fetch event ${id}:`, error)
    }
  }, [selected, releases, onEventDetailsUpdate])

  return {
    sendEvent,
    fetchEvent
  }
}