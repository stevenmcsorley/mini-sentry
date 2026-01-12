import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
  testId?: string
}

const variants = {
  default: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  success: 'bg-green-500/20 text-green-300 border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  error: 'bg-red-500/20 text-red-300 border-red-500/30',
  info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
}

const dotColors = {
  default: 'bg-slate-400',
  success: 'bg-green-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-blue-400',
  purple: 'bg-purple-400'
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs'
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  testId
}: BadgeProps) => (
  <span
    className={`
      inline-flex items-center gap-1.5 rounded-full border font-medium
      ${variants[variant]} ${sizes[size]} ${className}
    `}
    data-testid={testId}
  >
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
    {children}
  </span>
)

interface StatusBadgeProps {
  status: 'open' | 'resolved' | 'ignored' | 'active' | 'inactive' | 'pending'
  size?: 'sm' | 'md'
  testId?: string
}

const statusConfig: Record<StatusBadgeProps['status'], { variant: BadgeProps['variant']; label: string }> = {
  open: { variant: 'error', label: 'Open' },
  resolved: { variant: 'success', label: 'Resolved' },
  ignored: { variant: 'default', label: 'Ignored' },
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'default', label: 'Inactive' },
  pending: { variant: 'warning', label: 'Pending' }
}

export const StatusBadge = ({ status, size = 'sm', testId }: StatusBadgeProps) => {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant} size={size} dot testId={testId}>
      {config.label}
    </Badge>
  )
}
