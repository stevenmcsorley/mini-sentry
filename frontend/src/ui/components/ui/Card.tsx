import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'gradient' | 'interactive' | 'stat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  testId?: string
}

const variants = {
  default: 'border border-slate-800/60 bg-slate-800/20',
  gradient: 'border border-slate-800/60 bg-gradient-to-r from-slate-800/30 to-slate-700/30',
  interactive: 'border border-slate-800/60 bg-slate-800/20 hover:bg-slate-800/40 transition-colors cursor-pointer',
  stat: 'border border-slate-800/60 bg-slate-800/20 text-center hover:bg-slate-800/40 transition-colors'
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
}

export const Card = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  testId
}: CardProps) => {
  return (
    <div
      className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${className}`}
      data-testid={testId}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  description?: string
  badge?: ReactNode
  actions?: ReactNode
  testId?: string
}

export const CardHeader = ({ title, description, badge, actions, testId }: CardHeaderProps) => (
  <div className="mb-4 flex items-center justify-between" data-testid={testId}>
    <div>
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {badge}
      </div>
      {description && (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
)

interface StatCardProps {
  value: number | string
  label: string
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  testId?: string
}

const statColors = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
  purple: 'text-purple-400'
}

export const StatCard = ({ value, label, color = 'blue', testId }: StatCardProps) => (
  <Card variant="stat" testId={testId}>
    <div className={`text-2xl font-bold ${statColors[color]}`}>{value}</div>
    <div className="text-sm text-slate-300">{label}</div>
  </Card>
)
