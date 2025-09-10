import { useState, useCallback } from 'react'

// Types
import type { 
  EventDetails,
  EditRuleState
} from './types/app.types'

// Components
import { Dashboard } from './Dashboard'
import { OverviewPage } from './components/OverviewPage'
import { NavRail } from './components/NavRail'
import { LogsView } from './components/LogsView'
import { ProjectsTab } from './components/ProjectsTab'

// Hooks
import { useProjects } from './hooks/useProjects'
import { useAppRouting } from './hooks/useAppRouting'
import { useProjectData } from './hooks/useProjectData'
import { useProjectService } from './hooks/useProjectService'
import { useEventService } from './hooks/useEventService'
import { useReleaseService } from './hooks/useReleaseService'
import { useAlertService } from './hooks/useAlertService'


interface AppState {
  sessionUser: string
  eventDetails: EventDetails
  editRule: EditRuleState
}

const initialState: AppState = {
  sessionUser: 'user-123',
  eventDetails: {},
  editRule: { threshold: 10, window: 5, notify: 60 }
}

export const App = () => {
  const { projects, reload } = useProjects()
  const [state, setState] = useState<AppState>(initialState)
  
  // Use routing hook for all URL/routing state
  const routing = useAppRouting(projects)
  
  // Use data hook for all project data fetching
  const projectData = useProjectData({
    selected: routing.selected,
    filterLevel: routing.filterLevel,
    filterEnv: routing.filterEnv,
    filterRelease: routing.filterRelease,
    search: routing.search,
    timeSel: routing.timeSel,
    eventLimit: routing.eventLimit,
    eventOffset: routing.eventOffset,
    activeTab: routing.activeTab,
    customRange: routing.customRange,
    range: routing.range,
    interval: routing.interval
  })

  // Service hooks for business logic
  const projectService = useProjectService({
    onProjectCreated: routing.setSelected,
    onReload: reload
  })

  const eventService = useEventService({
    selected: routing.selected,
    msg: 'Real-time event monitoring',
    releases: projectData.releases,
    onRefetch: projectData.refetch,
    onEventDetailsUpdate: (id, details) => {
      setState(prev => ({
        ...prev,
        eventDetails: { ...prev.eventDetails, [id]: details }
      }))
    }
  })

  const releaseService = useReleaseService({
    selected: routing.selected,
    releases: projectData.releases,
    sessionUser: state.sessionUser,
    range: routing.range,
    interval: routing.interval,
    onRefetch: projectData.refetch
  })

  const alertService = useAlertService({
    selected: routing.selected,
    rules: projectData.rules,
    editRule: state.editRule,
    onRefetch: projectData.refetch
  })

  const refreshSeries = useCallback(() => {
    if (!routing.selected) return
    projectData.refetch()
  }, [routing.selected, projectData])


  // Simple state setters for non-routing state
  const setSessionUser = useCallback((sessionUser: string) => {
    setState(prev => ({ ...prev, sessionUser }))
  }, [])

  const setEditRule = useCallback((editRule: EditRuleState) => {
    setState(prev => ({ ...prev, editRule }))
  }, [])


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="w-full px-6 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Mini Sentry UI</h1>
        <div className="grid grid-cols-[56px_1fr] gap-6">
          <NavRail activeTab={routing.activeTab} onChange={routing.setActiveTab} />
          <main className="min-w-0 flex-1">
            <div className="space-y-4">
              {routing.activeTab === 'projects' ? (
                <ProjectsTab
                  projects={projects}
                  selected={routing.selected || projects[0]}
                  setSelected={routing.setSelected}
                  onCreate={projectService.createProject}
                />
              ) : routing.activeTab === 'dashboard' ? (
                routing.selected ? (
                  <Dashboard 
                    projectSlug={routing.selected.slug} 
                    fromTo={routing.timeSel || undefined} 
                  />
                ) : (
                  <p className="text-sm text-slate-400">
                    Create or select a project in Projects tab.
                  </p>
                )
              ) : routing.activeTab === 'logs' ? (
                routing.selected ? (
                  <LogsView
                    selected={routing.selected}
                    projects={projects}
                    setSelected={routing.setSelected}
                    search={routing.search}
                    setSearch={routing.setSearch}
                    filterLevel={routing.filterLevel}
                    setFilterLevel={routing.setFilterLevel}
                    filterEnv={routing.filterEnv}
                    setFilterEnv={routing.setFilterEnv}
                    filterRelease={routing.filterRelease}
                    setFilterRelease={routing.setFilterRelease}
                    events={projectData.events}
                    onView={eventService.fetchEvent}
                    eventDetails={state.eventDetails}
                    range={routing.range}
                    interval={routing.interval}
                    setRange={routing.setRange}
                    setInterval={routing.setInterval}
                    timeSel={routing.timeSel}
                    setTimeSel={routing.setTimeSel}
                    eventLimit={routing.eventLimit}
                    setEventLimit={routing.setEventLimit}
                    eventOffset={routing.eventOffset}
                    setEventOffset={routing.setEventOffset}
                    eventTotal={projectData.eventTotal}
                    customRange={routing.customRange}
                    setCustomRange={routing.setCustomRange}
                    onNewRealtimeEvent={projectData.addRealtimeEvent}
                  />
                ) : (
                  <p className="text-sm text-slate-400">
                    Create or select a project in Projects tab.
                  </p>
                )
              ) : (
                routing.selected ? (
                  <OverviewPage
                    selected={routing.selected}
                    releases={projectData.releases}
                    createRelease={releaseService.createRelease}
                    deploys={projectData.deploys}
                    createDeployment={releaseService.createDeployment}
                    sessionUser={state.sessionUser}
                    setSessionUser={setSessionUser}
                    sendSession={releaseService.sendSession}
                    range={routing.range}
                    setRange={routing.setRange}
                    interval={routing.interval}
                    setInterval={routing.setInterval}
                    refreshSeries={refreshSeries}
                    series={projectData.series}
                    health={projectData.health}
                    rules={projectData.rules}
                    createRule={alertService.createRule}
                    editRule={state.editRule}
                    setEditRule={setEditRule}
                    updateFirstRule={alertService.updateFirstRule}
                    groups={projectData.groups}
                    setGroups={() => {}}
                    snoozeGroup={alertService.snoozeGroup}
                  />
                ) : (
                  <p 
                    className="text-sm text-slate-400" 
                    data-testid="overview-no-project"
                  >
                    Create or select a project in Projects tab.
                  </p>
                )
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}