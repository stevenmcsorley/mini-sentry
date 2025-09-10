import { useCallback } from 'react'
import type { Project, AlertRule, EditRuleState } from '../types/app.types'
import { api } from '../utils/api.utils'

interface UseAlertServiceParams {
  selected: Project | null
  rules: AlertRule[]
  editRule: EditRuleState
  onRefetch: () => void
}

export const useAlertService = ({ selected, rules, editRule, onRefetch }: UseAlertServiceParams) => {
  const createRule = useCallback(async (name: string, level: string, threshold: number, targetType: 'email'|'webhook', targetValue: string) => {
    if (!selected) return
    
    await api('/api/alert-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        project: selected.id, 
        name, 
        level, 
        threshold_count: threshold, 
        target_type: targetType, 
        target_value: targetValue 
      }),
    })
    
    onRefetch()
  }, [selected, onRefetch])

  const updateFirstRule = useCallback(async () => {
    if (!selected || rules.length === 0) return
    
    const id = rules[0].id
    await api(`/api/alert-rules/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        threshold_count: editRule.threshold, 
        threshold_window_minutes: editRule.window, 
        notify_interval_minutes: editRule.notify 
      })
    })
    
    onRefetch()
  }, [selected, rules, editRule, onRefetch])

  const snoozeGroup = useCallback(async (groupId: number, minutes = 60) => {
    if (!selected || rules.length === 0) return
    
    const ruleId = rules[0].id
    await api(`/api/alert-rules/${ruleId}/snooze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: groupId, minutes })
    })
    alert('Snoozed alerts for this group')
  }, [selected, rules])

  return {
    createRule,
    updateFirstRule,
    snoozeGroup
  }
}