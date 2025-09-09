export type Project = {
  id: number
  name: string
  slug: string
  ingest_token: string
}

export type Group = {
  id: number
  title: string
  level: string
  count: number
  last_seen: string
}

export type Event = {
  id: number
  message: string
  level: string
  received_at: string
  release?: number
  environment?: string
  tags?: Array<{ key?: string; value: string } | string>
  payload?: Record<string, any>
  stack?: string
  symbolicated?: {
    frames?: Array<{
      function?: string
      file?: string
      orig_file?: string
      line?: number
      orig_line?: number
      column?: number
      orig_column?: number
    }>
  }
}

export type Release = {
  id: number
  version: string
  environment: string
  created_at: string
}

export type AlertRule = {
  id: number
  name: string
  level: string
  threshold_count: number
  target_type: 'email' | 'webhook'
  target_value: string
}

export type Deployment = {
  id: number
  name: string
  url: string
  environment: string
  date_started: string
  date_finished?: string
  release: number
}

export type TimeRange = '1h' | '24h' | '7d' | '14d' | '30d' | '90d' | '1y'

export type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '24h' | '7d' | '30d'

export type NavigationTab = 'logs' | 'overview' | 'dashboard' | 'projects'

export type CustomRangeType = {
  value: number
  unit: string
  label: string
}

export type TimeSelection = {
  from: string
  to: string
}

export type SearchToken = {
  key?: string
  value: string
  raw: string
}

export type LegendSelection = {
  [key: string]: boolean
}

export type EventDetails = Record<number, Event & { _symSource?: 'stored' | 'live' }>

export type EditRuleState = {
  threshold: number
  window: number
  notify: number
}

export type SeriesDataPoint = {
  bucket: string
  error?: number
  warning?: number
  info?: number
  count?: number
}

export type StatusCounts = {
  releases: number
  artifacts: number
}