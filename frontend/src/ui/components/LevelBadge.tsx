import React from 'react'

function levelDot(level: string) {
  return level === 'error' ? '🔴' : level === 'warning' ? '🟡' : '🔵'
}

interface LevelBadgeProps {
  level: string
}

export function LevelBadge({ level }: LevelBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-1 text-xs">
      {levelDot(level)}
      {level}
    </span>
  )
}