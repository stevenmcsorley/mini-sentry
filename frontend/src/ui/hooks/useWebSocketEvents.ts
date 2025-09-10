import { useEffect, useRef, useCallback, useState } from 'react'

interface WebSocketEventsOptions {
  projectSlug: string
  enabled: boolean
  onNewEvent: (event: RealTimeEvent) => void
  onError?: (error: string) => void
  onConnectionChange?: (connected: boolean) => void
}

interface RealTimeEvent {
  type: 'event' | 'connection' | 'pong'
  id?: string
  project?: string
  level?: string
  message?: string
  timestamp?: number
  environment?: string
  fingerprint?: string
  status?: string
}

interface UseWebSocketEventsReturn {
  isConnected: boolean
  reconnect: () => void
  disconnect: () => void
}

export const useWebSocketEvents = ({
  projectSlug,
  enabled,
  onNewEvent,
  onError,
  onConnectionChange
}: WebSocketEventsOptions): UseWebSocketEventsReturn => {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectAttemptRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const pingIntervalRef = useRef<NodeJS.Timeout>()

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Always connect to backend server (port 8000) for WebSocket
    const host = window.location.hostname
    const port = '8000'
    return `${protocol}//${host}:${port}/ws/events/${projectSlug}/`
  }, [projectSlug])

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = undefined
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    onConnectionChange?.(false)
  }, [onConnectionChange])

  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }))
      }
    }, 30000) // Ping every 30 seconds
  }, [])

  const connect = useCallback(() => {
    if (!enabled || !projectSlug) {
      cleanup()
      return
    }

    // Don't connect if already connecting or connected
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const wsUrl = getWebSocketUrl()
      console.log(`[WebSocket] Attempting to connect to: ${wsUrl}`)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log(`[WebSocket] ✅ Successfully connected to project: ${projectSlug}`)
        setIsConnected(true)
        onConnectionChange?.(true)
        reconnectAttemptRef.current = 0
        startPingInterval()
      }

      ws.onmessage = (event) => {
        try {
          const data: RealTimeEvent = JSON.parse(event.data)
          
          if (data.type === 'event') {
            onNewEvent(data)
          } else if (data.type === 'connection') {
            console.log(`[WebSocket] Connection confirmed for project: ${data.project}`)
          } else if (data.type === 'pong') {
            // Pong received, connection is alive
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
          onError?.('Failed to parse WebSocket message')
        }
      }

      ws.onerror = (error) => {
        console.error(`[WebSocket] ❌ Connection error to ${wsUrl}:`, error)
        onError?.('WebSocket connection error')
      }

      ws.onclose = (event) => {
        console.log(`[WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}`)
        setIsConnected(false)
        onConnectionChange?.(false)
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = undefined
        }

        // Attempt to reconnect if enabled and not a deliberate close
        if (enabled && event.code !== 1000 && reconnectAttemptRef.current < maxReconnectAttempts) {
          const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 10000)
          console.log(`[WebSocket] Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttemptRef.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current++
            connect()
          }, backoffDelay)
        } else if (reconnectAttemptRef.current >= maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached')
          onError?.('Unable to establish WebSocket connection after multiple attempts')
        }
      }
    } catch (error) {
      console.error(`[WebSocket] ❌ Failed to create connection to ${getWebSocketUrl()}:`, error)
      onError?.('Failed to create WebSocket connection')
    }
  }, [enabled, projectSlug, getWebSocketUrl, onNewEvent, onError, onConnectionChange, startPingInterval, cleanup])

  const disconnect = useCallback(() => {
    cleanup()
  }, [cleanup])

  const reconnect = useCallback(() => {
    cleanup()
    reconnectAttemptRef.current = 0
    if (enabled) {
      // Small delay to ensure cleanup is complete
      setTimeout(connect, 100)
    }
  }, [enabled, connect, cleanup])

  useEffect(() => {
    connect()
    return cleanup
  }, [connect, cleanup])

  return {
    isConnected,
    reconnect,
    disconnect
  }
}

export default useWebSocketEvents