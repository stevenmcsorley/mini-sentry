// Core business domain types for Mini Sentry UI

export interface Project {
  id: number
  name: string
  slug: string
  ingestToken: string
  createdAt?: Date
}

export interface Group {
  id: number
  title: string
  level: string
  count: number
  lastSeen: string
  status?: 'resolved' | 'unresolved' | 'ignored'
  assignee?: string
}

export interface Event {
  id: number
  message: string
  level: string
  receivedAt: string
  groupId?: number
  tags?: Record<string, string>
  context?: Record<string, any>
}

export interface Release {
  id: number
  version: string
  environment: string
  createdAt: string
  projects?: Project[]
  commits?: Commit[]
}

export interface Commit {
  id: string
  message: string
  author: string
  timestamp: string
}

export interface AlertRule {
  id: number
  name: string
  level: string
  thresholdCount: number
  targetType: 'email' | 'webhook'
  targetValue: string
  isActive?: boolean
  createdAt?: string
}

export interface Deployment {
  id: number
  name: string
  url: string
  environment: string
  dateStarted: string
  dateFinished?: string
  releaseId?: number
  status?: 'pending' | 'success' | 'failed'
}

export interface Artifact {
  id: number
  name: string
  content: string
  contentType: string
  releaseId: number
  uploadedAt?: string
  size?: number
}

export interface User {
  id: string
  email?: string
  username?: string
  avatar?: string
}

// Event level types
export type EventLevel = 'error' | 'warning' | 'info' | 'debug'

// Time range types
export type TimeRange = '1h' | '24h' | '7d' | '14d' | '30d' | '90d' | '1y'
export type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '24h' | '7d' | '30d'

// Navigation types
export type NavigationTab = 'logs' | 'overview' | 'dashboard' | 'projects'

// Chart data types
export interface ChartDataPoint {
  timestamp: string
  count: number
  level?: EventLevel
}

export interface TimeSeriesData {
  data: ChartDataPoint[]
  range: TimeRange
  interval: TimeInterval
}