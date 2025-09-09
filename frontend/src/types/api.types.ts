// API response types matching the backend structure

export interface APIProject {
  id: number
  name: string
  slug: string
  ingest_token: string
  created_at?: string
}

export interface APIGroup {
  id: number
  title: string
  level: string
  count: number
  last_seen: string
  status?: string
  assignee?: string
}

export interface APIEvent {
  id: number
  message: string
  level: string
  received_at: string
  group_id?: number
  tags?: Record<string, string>
  context?: Record<string, any>
}

export interface APIRelease {
  id: number
  version: string
  environment: string
  created_at: string
  projects?: APIProject[]
}

export interface APIAlertRule {
  id: number
  name: string
  level: string
  threshold_count: number
  target_type: 'email' | 'webhook'
  target_value: string
  is_active?: boolean
  created_at?: string
}

export interface APIDeployment {
  id: number
  name: string
  url: string
  environment: string
  date_started: string
  date_finished?: string
  release?: number
  status?: string
}

export interface APIArtifact {
  id: number
  name: string
  content: string
  content_type: string
  release: number
  uploaded_at?: string
  size?: number
}

// Generic API response wrapper
export interface APIResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}

// API request types
export interface CreateProjectRequest {
  name: string
}

export interface CreateReleaseRequest {
  version: string
  environment: string
}

export interface CreateAlertRuleRequest {
  name: string
  level: string
  threshold_count: number
  target_type: 'email' | 'webhook'
  target_value: string
}

export interface CreateDeploymentRequest {
  name: string
  url: string
  environment: string
  release?: number
}

export interface CreateArtifactRequest {
  name: string
  content: string
  content_type: string
}

export interface UpdateGroupRequest {
  status?: string
  assignee?: string
  comment?: string
}

// Error response type
export interface APIError {
  error: string
  details?: Record<string, string[]>
  code?: string
}