import React, { useCallback } from 'react'

type NavigationTab = 'logs' | 'overview' | 'dashboard' | 'projects'

interface NavRailProps {
  activeTab: NavigationTab
  onChange: (tab: NavigationTab) => void
  testId?: string
}

export const NavRail: React.FC<NavRailProps> = ({ 
  activeTab, 
  onChange,
  testId = 'nav-rail' 
}) => {
  const Icon = ({ children }: { children: React.ReactNode }) => (
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
  
  const Cog = () => (
    <Icon>
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
      <path d="M19.4 15a7.97 7.97 0 0 0 .1-2l2-1.2-2-3.5-2.3.6a8.06 8.06 0 0 0-1.7-1l-.3-2.4H11l-.3 2.4a8.06 8.06 0 0 0-1.7 1l-2.3-.6-2 3.5 2 1.2a7.97 7.97 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.6c.5.4 1.1.7 1.7 1l.3 2.4h3.8l.3-2.4c.6-.3 1.2-.6 1.7-1l2.3.6 2-3.5-2-1.2z" />
    </Icon>
  )
  
  const NavItem: React.FC<{
    label: string
    isActive?: boolean
    onClick?: () => void
    icon: React.ReactNode
    testId?: string
  }> = useCallback(({ label, isActive, onClick, icon, testId }) => (
    <button 
      title={label} 
      onClick={onClick} 
      className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
        isActive 
          ? 'bg-slate-800 text-white' 
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
      }`} 
      aria-label={label}
      data-testid={testId}
    >
      <span>{icon}</span>
    </button>
  ), [])
  
  return (
    <nav 
      className="sticky top-4 flex h-[calc(100vh-2rem)] w-14 flex-col items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/50 p-2 backdrop-blur-sm" 
      data-testid={testId}
    >
      <div 
        className="mb-2 mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold shadow-lg" 
        data-testid="nav-logo"
        title="Mini Sentry"
      >
        MS
      </div>
      
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
      <NavItem 
        label="Projects" 
        isActive={activeTab === 'projects'} 
        onClick={() => onChange('projects')} 
        icon={<Folder />} 
        testId="nav-projects" 
      />
      
      <div className="mt-auto" />
      
      <NavItem 
        label="Settings" 
        icon={<Cog />} 
        testId="nav-settings" 
      />
    </nav>
  )
}