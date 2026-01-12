import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  testId?: string
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  testId
}: EmptyStateProps) => (
  <div
    className="rounded-xl border border-slate-800/60 bg-slate-800/10 p-8 text-center"
    data-testid={testId}
  >
    {icon && (
      <div className="text-5xl mb-4">{icon}</div>
    )}
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    {description && (
      <p className="text-slate-400 mb-4 max-w-md mx-auto">{description}</p>
    )}
    {action}
  </div>
)

interface NoProjectSelectedProps {
  testId?: string
}

export const NoProjectSelected = ({ testId }: NoProjectSelectedProps) => (
  <EmptyState
    icon={
      <svg className="h-12 w-12 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    }
    title="No project selected"
    description="Create or select a project in the Projects tab to get started."
    testId={testId}
  />
)
