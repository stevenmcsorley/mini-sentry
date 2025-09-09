import { useState, useEffect } from 'react'
import type { StatusCounts } from '../types/app.types'
import { api } from '../utils/api.utils'

interface StatusSummaryProps {
  projectSlug: string
  className?: string
  testId?: string
}

export const StatusSummary = ({ 
  projectSlug, 
  className,
  testId = 'status-summary' 
}: StatusSummaryProps) => {
  const [counts, setCounts] = useState<StatusCounts>({ releases: 0, artifacts: 0 })
  
  useEffect(() => {
    let stop = false
    
    const fetchCounts = async () => {
      try {
        const rels = await api(`/api/releases/?project=${projectSlug}`)
        if (stop) return
        
        const lists = await Promise.all(
          (rels || []).map((r: any) => 
            api(`/api/releases/${r.id}/artifacts/`)
              .catch(() => [])
          )
        )
        
        const totalArtifacts = lists.reduce(
          (acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 
          0
        )
        
        if (!stop) {
          setCounts({ 
            releases: (rels || []).length, 
            artifacts: totalArtifacts 
          })
        }
      } catch {
        if (!stop) setCounts({ releases: 0, artifacts: 0 })
      }
    }
    
    fetchCounts()
    return () => { stop = true }
  }, [projectSlug])
  
  return (
    <div 
      className={[
        "hidden items-center gap-2 text-xs text-slate-300 md:flex",
        className
      ].filter(Boolean).join(" ")} 
      data-testid={testId}
    >
      <span 
        className="rounded bg-slate-800/60 px-2 py-1"
        data-testid="releases-count"
      >
        releases {counts.releases}
      </span>
      <span 
        className="rounded bg-slate-800/60 px-2 py-1"
        data-testid="artifacts-count"
      >
        artifacts {counts.artifacts}
      </span>
    </div>
  )
}