import React from 'react'

type EventLevel = 'error' | 'warning' | 'info' | 'debug'

interface LevelBadgeProps {
  level: string
  variant?: 'default' | 'compact'
  testId?: string
}

const getLevelStyles = (level: string) => {
  const normalizedLevel = level.toLowerCase() as EventLevel
  
  switch (normalizedLevel) {
    case 'error':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-300',
        border: 'border-red-500/30',
        dot: 'bg-red-500',
        emoji: '🔴'
      }
    case 'warning':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-300',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
        emoji: '🟡'
      }
    case 'info':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
        dot: 'bg-blue-400',
        emoji: '🔵'
      }
    case 'debug':
      return {
        bg: 'bg-gray-500/20',
        text: 'text-gray-300',
        border: 'border-gray-500/30',
        dot: 'bg-gray-400',
        emoji: '🔘'
      }
    default:
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
        dot: 'bg-blue-400',
        emoji: '🔵'
      }
  }
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ 
  level, 
  variant = 'default',
  testId = 'level-badge' 
}) => {
  const styles = getLevelStyles(level)
  
  if (variant === 'compact') {
    return (
      <span 
        className={`inline-block h-2 w-2 rounded-full ${styles.dot}`}
        title={level}
        data-testid={`${testId}-dot`}
      />
    )
  }
  
  return (
    <span 
      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium ${styles.bg} ${styles.text} ${styles.border}`}
      data-testid={testId}
    >
      <span 
        className={`h-2 w-2 rounded-full ${styles.dot}`}
        data-testid={`${testId}-indicator`}
      />
      <span className="capitalize">{level}</span>
    </span>
  )
}