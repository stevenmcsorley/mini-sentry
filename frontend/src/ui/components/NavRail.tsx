import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'

type NavigationTab = 'logs' | 'overview' | 'dashboard' | 'projects' | 'releases' | 'alerts'

interface NavRailProps {
  activeTab: NavigationTab
  onChange: (tab: NavigationTab) => void
  className?: string
  testId?: string
}

export const NavRail = ({
  activeTab,
  onChange,
  className,
  testId = 'nav-rail'
}: NavRailProps) => {
  const Icon = ({ children }: { children: ReactNode }) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  )

  const Home = () => (
    <Icon>
      <path d="M3 10.5L12 3l9 7.5V21a2 2 0 0 1-2 2h-5v-6H10v6H5a2 2 0 0 1-2-2V10.5z" />
      <path d="M3 10.5L12 3l9 7.5" />
    </Icon>
  )

  const Search = () => (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  )

  const Chart = () => (
    <Icon>
      <path d="M4 20V6" />
      <path d="M10 20V10" />
      <path d="M16 20V4" />
      <path d="M2 20h20" />
    </Icon>
  )

  const Folder = () => (
    <Icon>
      <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </Icon>
  )

  const Package = () => (
    <Icon>
      <path d="m7.5 4.27 9 5.15M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.29 7 12 12l8.71-5" />
      <path d="M12 22V12" />
    </Icon>
  )

  const Bell = () => (
    <Icon>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="m13.73 21a2 2 0 0 1-3.46 0" />
    </Icon>
  )

  const Cog = () => (
    <Icon>
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
      <path d="M19.4 15a7.97 7.97 0 0 0 .1-2l2-1.2-2-3.5-2.3.6a8.06 8.06 0 0 0-1.7-1l-.3-2.4H11l-.3 2.4a8.06 8.06 0 0 0-1.7 1l-2.3-.6-2 3.5 2 1.2a7.97 7.97 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.6c.5.4 1.1.7 1.7 1l.3 2.4h3.8l.3-2.4c.6-.3 1.2-.6 1.7-1l2.3.6 2-3.5-2-1.2z" />
    </Icon>
  )

  const NavItem = useCallback(({ label, isActive, onClick, icon, testId, badge }: {
    label: string
    isActive?: boolean
    onClick?: () => void
    icon: ReactNode
    testId?: string
    badge?: number
  }) => {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
      <div className="relative">
        <button
          title={label}
          onClick={onClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`
            relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200
            ${isActive
              ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }
          `}
          aria-label={label}
          aria-current={isActive ? 'page' : undefined}
          data-testid={testId}
        >
          {/* Active indicator bar */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-blue-500" />
          )}
          <span className={isActive ? 'scale-110 transition-transform' : 'transition-transform'}>{icon}</span>
          {/* Badge */}
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="relative bg-slate-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
              {label}
              {/* Arrow */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-700 rotate-45" />
            </div>
          </div>
        )}
      </div>
    )
  }, [])

  const Divider = () => (
    <div className="w-6 h-px bg-slate-700/60 my-1" />
  )

  return (
    <nav
      className={[
        "sticky top-4 flex h-[calc(100vh-2rem)] w-14 flex-col items-center gap-1.5 rounded-xl border border-slate-800/60 bg-slate-900/80 p-2 backdrop-blur-md shadow-xl",
        className
      ].filter(Boolean).join(" ")}
      data-testid={testId}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        className="mb-3 mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105"
        data-testid="nav-logo"
        title="Mini Sentry"
      >
        MS
      </div>

      <Divider />

      {/* Main navigation items */}
      <NavItem
        label="Overview"
        isActive={activeTab === 'overview'}
        onClick={() => onChange('overview')}
        icon={<Home />}
        testId="nav-overview"
      />
      <NavItem
        label="Explore (Logs)"
        isActive={activeTab === 'logs'}
        onClick={() => onChange('logs')}
        icon={<Search />}
        testId="nav-logs"
      />
      <NavItem
        label="Dashboards"
        isActive={activeTab === 'dashboard'}
        onClick={() => onChange('dashboard')}
        icon={<Chart />}
        testId="nav-dashboard"
      />

      <Divider />

      <NavItem
        label="Releases"
        isActive={activeTab === 'releases'}
        onClick={() => onChange('releases')}
        icon={<Package />}
        testId="nav-releases"
      />
      <NavItem
        label="Alerts"
        isActive={activeTab === 'alerts'}
        onClick={() => onChange('alerts')}
        icon={<Bell />}
        testId="nav-alerts"
      />
      <NavItem
        label="Projects"
        isActive={activeTab === 'projects'}
        onClick={() => onChange('projects')}
        icon={<Folder />}
        testId="nav-projects"
      />

      {/* Spacer */}
      <div className="mt-auto" />

      <Divider />

      {/* Settings at bottom */}
      <NavItem
        label="Settings"
        icon={<Cog />}
        testId="nav-settings"
      />
    </nav>
  )
}
