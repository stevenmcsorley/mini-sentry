import type { 
  Project, 
  Event, 
  EventDetails, 
  TimeRange, 
  TimeInterval, 
  TimeSelection, 
  CustomRangeType,
  LegendSelection
} from '../../types/app.types'

export interface LogsViewProps {
  selected: Project
  projects: Project[]
  setSelected: (p: Project) => void
  search: string
  setSearch: (s: string) => void
  filterLevel: string
  setFilterLevel: (s: string) => void
  filterEnv: string
  setFilterEnv: (s: string) => void
  filterRelease: string
  setFilterRelease: (s: string) => void
  events: Event[]
  onView: (id: number) => void
  eventDetails: EventDetails
  range: TimeRange
  interval: TimeInterval
  setRange: (r: TimeRange) => void
  setInterval: (i: TimeInterval) => void
  timeSel: TimeSelection | null
  setTimeSel: (v: TimeSelection | null) => void
  eventLimit: number
  setEventLimit: (n: number) => void
  eventOffset: number
  setEventOffset: (n: number) => void
  eventTotal: number
  customRange: CustomRangeType | null
  setCustomRange: (customRange: CustomRangeType | null) => void
  onNewRealtimeEvent?: (event: Event) => void
  className?: string
  testId?: string
}