// UI component prop types and interfaces

import { ReactNode } from 'react'
import { 
  Project, 
  Group, 
  Event, 
  Release, 
  AlertRule, 
  Deployment, 
  NavigationTab, 
  TimeRange, 
  TimeInterval 
} from './domain.types'

// Base component props
export interface BaseComponentProps {
  testId?: string
  className?: string
  children?: ReactNode
}

// Form component props
export interface ProjectFormProps extends BaseComponentProps {
  onCreate: (name: string) => void | Promise<void>
  isLoading?: boolean
}

export interface ReleaseFormProps extends BaseComponentProps {
  onCreate: (version: string, environment: string) => void | Promise<void>
  isLoading?: boolean
}

export interface AlertRuleFormProps extends BaseComponentProps {
  onCreate: (
    name: string, 
    level: string, 
    threshold: number, 
    targetType: 'email' | 'webhook', 
    targetValue: string
  ) => void | Promise<void>
  isLoading?: boolean
}

export interface DeploymentFormProps extends BaseComponentProps {
  onCreate: (
    name: string, 
    url: string, 
    environment: string, 
    releaseId?: number
  ) => void | Promise<void>
  releases?: Release[]
  isLoading?: boolean
}

export interface ArtifactFormProps extends BaseComponentProps {
  releaseId: number
  onUpload: (name: string, content: string, contentType: string) => void | Promise<void>
  isLoading?: boolean
}

export interface AddTargetFormProps extends BaseComponentProps {
  ruleId: number
  onAdded: () => void | Promise<void>
  isLoading?: boolean
}

// List component props
export interface ProjectListProps extends BaseComponentProps {
  projects: Project[]
  selectedProject?: Project | null
  onProjectSelect: (project: Project) => void
  onProjectCreate?: (name: string) => void
  isLoading?: boolean
}

export interface GroupListProps extends BaseComponentProps {
  groups: Group[]
  onGroupSelect?: (group: Group) => void
  onGroupAction?: (groupId: number, action: 'resolve' | 'unresolve' | 'ignore' | 'assign', value?: string) => void
  isLoading?: boolean
}

export interface EventListProps extends BaseComponentProps {
  events: Event[]
  onEventSelect?: (event: Event) => void
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

// Navigation component props
export interface NavRailProps extends BaseComponentProps {
  activeTab: NavigationTab
  onChange: (tab: NavigationTab) => void
}

// Utility component props
export interface LevelBadgeProps extends BaseComponentProps {
  level: string
  variant?: 'default' | 'compact'
}

export interface TimeRangeMenuProps extends BaseComponentProps {
  range: TimeRange
  setRange: (range: TimeRange) => void
  setInterval: (interval: TimeInterval) => void
  setTimeSel: (selection: { from: string; to: string } | null) => void
  onCustomRange?: (customRange: { value: number; unit: string; label: string } | null) => void
}

// Modal component props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface ConfirmModalProps extends ModalProps {
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: 'danger' | 'warning' | 'info'
}

// Chart component props
export interface ChartProps extends BaseComponentProps {
  data: any[]
  height?: number
  width?: string
  loading?: boolean
}

// Overview page props
export interface OverviewPageProps extends BaseComponentProps {
  project: Project
  onProjectChange?: (project: Project) => void
}

// Hook return types
export interface UseProjectsReturn {
  projects: Project[]
  selectedProject: Project | null
  isLoading: boolean
  error: string | null
  selectProject: (project: Project) => void
  createProject: (name: string) => Promise<void>
  reloadProjects: () => Promise<void>
}

export interface UseGroupsReturn {
  groups: Group[]
  isLoading: boolean
  error: string | null
  reloadGroups: () => Promise<void>
  updateGroup: (groupId: number, action: string, value?: string) => Promise<void>
}

export interface UseEventsReturn {
  events: Event[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
  reloadEvents: () => Promise<void>
}