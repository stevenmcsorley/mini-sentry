import { useState, useEffect, useCallback, useRef } from 'react'

interface RealTimeEventsOptions {
  projectSlug: string
  enabled: boolean
  onNewEvent?: (event: any) => void
  onError?: (error: Event) => void
  onConnectionChange?: (connected: boolean) => void
}

interface UseRealTimeEventsReturn {
  isConnected: boolean
  connectionError: string | null
  eventCount: number
  lastEventTime: string | null
}

export const useRealTimeEvents = ({
  projectSlug,
  enabled,
  onNewEvent,
  onError,
  onConnectionChange
}: RealTimeEventsOptions): UseRealTimeEventsReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [eventCount, setEventCount] = useState(0)
  const [lastEventTime, setLastEventTime] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
    onConnectionChange?.(false)
  }, [onConnectionChange])

  const connect = useCallback(() => {
    if (!enabled || !projectSlug) {
      cleanup()
      return
    }

    // Clean up existing connection
    cleanup()

    try {
      const eventSource = new EventSource(`/api/events/stream/?project=${projectSlug}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
        onConnectionChange?.(true)
        console.log(`[SSE] Connected to real-time events for project: ${projectSlug}`)
      }

      eventSource.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data)
          setEventCount(prev => prev + 1)
          setLastEventTime(new Date().toISOString())
          onNewEvent?.(eventData)
          console.log('[SSE] New event received:', eventData)
        } catch (error) {
          console.error('[SSE] Failed to parse event data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error)
        setIsConnected(false)
        onConnectionChange?.(false)
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000)
          
          setConnectionError(`Connection lost. Retrying in ${Math.ceil(delay / 1000)}s...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[SSE] Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`)
            connect()
          }, delay)
        } else {
          setConnectionError('Failed to connect to real-time events. Please refresh the page.')
          onError?.(error)
        }
      }

      // Handle specific event types if the server sends them
      eventSource.addEventListener('event', (event) => {
        try {
          const eventData = JSON.parse(event.data)
          setEventCount(prev => prev + 1)
          setLastEventTime(new Date().toISOString())
          onNewEvent?.(eventData)
        } catch (error) {
          console.error('[SSE] Failed to parse event data:', error)
        }
      })

      eventSource.addEventListener('heartbeat', () => {
        // Server heartbeat to keep connection alive
        console.log('[SSE] Heartbeat received')
      })

    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error)
      setConnectionError('Failed to initialize real-time connection')
      onError?.(error as Event)
    }
  }, [enabled, projectSlug, onNewEvent, onError, onConnectionChange, cleanup])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      cleanup()
      setEventCount(0)
      setLastEventTime(null)
      setConnectionError(null)
    }

    return cleanup
  }, [enabled, connect, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    isConnected,
    connectionError,
    eventCount,
    lastEventTime
  }
}