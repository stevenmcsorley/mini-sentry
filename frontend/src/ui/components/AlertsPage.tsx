import { useState, useCallback } from 'react'
import { LevelBadge } from './LevelBadge'
import type { Project, AlertRule } from '../types/app.types'

interface AlertsPageProps {
  selected: Project | null
  rules: AlertRule[]
  onRuleCreated: () => void
  className?: string
  testId?: string
}

interface CreateRuleForm {
  name: string
  level: string
  thresholdCount: number
  thresholdWindowMinutes: number
  notifyIntervalMinutes: number
  targetType: 'email' | 'webhook'
  targetValue: string
}

interface EditRuleData extends CreateRuleForm {
  id: number
  active: boolean
}

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(path, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const AlertsPage = ({ 
  selected, 
  rules, 
  onRuleCreated, 
  className = '', 
  testId = 'alerts-page' 
}: AlertsPageProps) => {
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null)
  const [editingRule, setEditingRule] = useState<EditRuleData | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  
  const [createForm, setCreateForm] = useState<CreateRuleForm>({
    name: '',
    level: 'error',
    thresholdCount: 10,
    thresholdWindowMinutes: 5,
    notifyIntervalMinutes: 60,
    targetType: 'email',
    targetValue: ''
  })

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      level: 'error',
      thresholdCount: 10,
      thresholdWindowMinutes: 5,
      notifyIntervalMinutes: 60,
      targetType: 'email',
      targetValue: ''
    })
    setShowCreateForm(false)
  }

  const handleCreateRule = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selected || !createForm.name.trim() || !createForm.targetValue.trim() || isCreating) return

    setIsCreating(true)
    try {
      await api('/api/alert-rules/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selected.id,
          name: createForm.name.trim(),
          level: createForm.level.trim(),
          threshold_count: createForm.thresholdCount,
          threshold_window_minutes: createForm.thresholdWindowMinutes,
          notify_interval_minutes: createForm.notifyIntervalMinutes,
          target_type: createForm.targetType,
          target_value: createForm.targetValue.trim()
        })
      })
      resetCreateForm()
      onRuleCreated()
    } catch (error) {
      console.error('Failed to create alert rule:', error)
    } finally {
      setIsCreating(false)
    }
  }, [selected, createForm, isCreating, onRuleCreated])

  const handleUpdateRule = useCallback(async () => {
    if (!editingRule || isUpdating) return

    setIsUpdating(true)
    try {
      await api(`/api/alert-rules/${editingRule.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingRule.name.trim(),
          level: editingRule.level.trim(),
          threshold_count: editingRule.thresholdCount,
          threshold_window_minutes: editingRule.thresholdWindowMinutes,
          notify_interval_minutes: editingRule.notifyIntervalMinutes,
          target_type: editingRule.targetType,
          target_value: editingRule.targetValue.trim(),
          active: editingRule.active
        })
      })
      setEditingRule(null)
      onRuleCreated()
    } catch (error) {
      console.error('Failed to update alert rule:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [editingRule, isUpdating, onRuleCreated])

  const handleDeleteRule = useCallback(async (ruleId: number) => {
    if (!window.confirm('Are you sure you want to delete this alert rule?')) return

    try {
      await api(`/api/alert-rules/${ruleId}/`, { method: 'DELETE' })
      onRuleCreated()
    } catch (error) {
      console.error('Failed to delete alert rule:', error)
    }
  }, [onRuleCreated])

  const handleToggleRule = useCallback(async (rule: AlertRule) => {
    try {
      await api(`/api/alert-rules/${rule.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !rule.active })
      })
      onRuleCreated()
    } catch (error) {
      console.error('Failed to toggle alert rule:', error)
    }
  }, [onRuleCreated])

  const startEditRule = (rule: AlertRule) => {
    setEditingRule({
      id: rule.id,
      name: rule.name,
      level: rule.level || '',
      thresholdCount: rule.threshold_count,
      thresholdWindowMinutes: rule.threshold_window_minutes || 5,
      notifyIntervalMinutes: rule.notify_interval_minutes || 60,
      targetType: rule.target_type as 'email' | 'webhook',
      targetValue: rule.target_value,
      active: rule.active
    })
  }

  if (!selected) {
    return (
      <div className={className} data-testid={testId}>
        <div className="text-center py-12">
          <p className="text-slate-400">Create or select a project in Projects tab.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} data-testid={testId}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Alert Management</h1>
            <p className="text-slate-300 mt-1">
              Configure automated alerts and notifications for <span className="font-mono text-blue-300">{selected.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-4 py-2 text-sm bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
            >
              📋 Alert Guide
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isCreating}
            >
              {showCreateForm ? 'Cancel' : '+ New Alert Rule'}
            </button>
            <div className="rounded-lg bg-slate-800/60 px-4 py-2">
              <div className="text-xs text-slate-400">Total Rules</div>
              <div className="text-2xl font-bold text-orange-400">{rules.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Guide */}
      {showGuide && (
        <div className="mb-8 rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
          <h2 className="text-xl font-semibold text-blue-300 mb-4">🚀 Alert Configuration Guide</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-3">📈 Threshold Settings</h3>
              <ul className="space-y-2 text-slate-300">
                <li><strong>Threshold Count:</strong> Number of events that trigger the alert</li>
                <li><strong>Window Minutes:</strong> Time window to count events (e.g., 10 errors in 5 minutes)</li>
                <li><strong>Notify Interval:</strong> Minimum time between notifications for same issue</li>
                <li><strong>Level Filter:</strong> Only trigger for specific error levels (optional)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">🔔 Notification Types</h3>
              <ul className="space-y-2 text-slate-300">
                <li><strong>Email:</strong> Send alerts to email addresses</li>
                <li><strong>Webhook:</strong> POST alerts to external services</li>
                <li><strong>Multiple Targets:</strong> Add multiple notification targets per rule</li>
                <li><strong>Templates:</strong> Customize email subject and body content</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-8 rounded-xl border border-slate-800/60 bg-slate-800/20 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Create New Alert Rule</h2>
          <form onSubmit={handleCreateRule} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rule Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="e.g., High Error Rate Alert"
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Error Level Filter</label>
                <select
                  value={createForm.level}
                  onChange={(e) => setCreateForm({...createForm, level: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Level</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Threshold Count</label>
                <input
                  type="number"
                  value={createForm.thresholdCount}
                  onChange={(e) => setCreateForm({...createForm, thresholdCount: parseInt(e.target.value) || 1})}
                  min="1"
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Window (minutes)</label>
                <input
                  type="number"
                  value={createForm.thresholdWindowMinutes}
                  onChange={(e) => setCreateForm({...createForm, thresholdWindowMinutes: parseInt(e.target.value) || 5})}
                  min="1"
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notify Interval (min)</label>
                <input
                  type="number"
                  value={createForm.notifyIntervalMinutes}
                  onChange={(e) => setCreateForm({...createForm, notifyIntervalMinutes: parseInt(e.target.value) || 60})}
                  min="1"
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notification Type</label>
                <select
                  value={createForm.targetType}
                  onChange={(e) => setCreateForm({...createForm, targetType: e.target.value as 'email' | 'webhook', targetValue: ''})}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {createForm.targetType === 'email' ? 'Email Address' : 'Webhook URL'}
                </label>
                <input
                  type={createForm.targetType === 'email' ? 'email' : 'url'}
                  value={createForm.targetValue}
                  onChange={(e) => setCreateForm({...createForm, targetValue: e.target.value})}
                  placeholder={createForm.targetType === 'email' ? 'alerts@example.com' : 'https://your-webhook-url.com/alerts'}
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={!createForm.name.trim() || !createForm.targetValue.trim() || isCreating}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  !createForm.name.trim() || !createForm.targetValue.trim() || isCreating
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCreating ? 'Creating...' : 'Create Alert Rule'}
              </button>
              <button
                type="button"
                onClick={resetCreateForm}
                className="px-6 py-2 rounded-lg font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="rounded-xl border border-slate-800/60 bg-slate-800/10 p-8 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-white mb-2">No alert rules yet</h3>
            <p className="text-slate-400 mb-4">
              Create your first alert rule above to start monitoring error thresholds and get notified when issues occur.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Alert Rule
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-slate-800/60 bg-slate-800/10 p-6">
              {editingRule?.id === rule.id ? (
                // Edit form
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Edit Alert Rule</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleUpdateRule}
                        disabled={isUpdating}
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                          isUpdating
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditingRule(null)}
                        className="px-4 py-2 text-sm rounded-lg font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Rule Name</label>
                      <input
                        type="text"
                        value={editingRule.name}
                        onChange={(e) => setEditingRule({...editingRule, name: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Error Level</label>
                      <select
                        value={editingRule.level}
                        onChange={(e) => setEditingRule({...editingRule, level: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Any Level</option>
                        <option value="error">Error</option>
                        <option value="warning">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Threshold</label>
                      <input
                        type="number"
                        value={editingRule.thresholdCount}
                        onChange={(e) => setEditingRule({...editingRule, thresholdCount: parseInt(e.target.value) || 1})}
                        min="1"
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Window (min)</label>
                      <input
                        type="number"
                        value={editingRule.thresholdWindowMinutes}
                        onChange={(e) => setEditingRule({...editingRule, thresholdWindowMinutes: parseInt(e.target.value) || 5})}
                        min="1"
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Notify Interval</label>
                      <input
                        type="number"
                        value={editingRule.notifyIntervalMinutes}
                        onChange={(e) => setEditingRule({...editingRule, notifyIntervalMinutes: parseInt(e.target.value) || 60})}
                        min="1"
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                      <select
                        value={editingRule.targetType}
                        onChange={(e) => setEditingRule({...editingRule, targetType: e.target.value as 'email' | 'webhook'})}
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="email">Email</option>
                        <option value="webhook">Webhook</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Target</label>
                      <input
                        type={editingRule.targetType === 'email' ? 'email' : 'url'}
                        value={editingRule.targetValue}
                        onChange={(e) => setEditingRule({...editingRule, targetValue: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={editingRule.active}
                        onChange={(e) => setEditingRule({...editingRule, active: e.target.checked})}
                        className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      Active (enable notifications)
                    </label>
                  </div>
                </div>
              ) : (
                // Display mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${rule.active ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                      <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
                      {rule.level && <LevelBadge level={rule.level} />}
                      {!rule.active && (
                        <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-slate-300">
                        <span className="font-medium">{rule.threshold_count}</span> events in{' '}
                        <span className="font-medium">{rule.threshold_window_minutes || 5}</span> min
                      </div>
                      <div className="text-xs text-slate-400">
                        Notify every {rule.notify_interval_minutes || 60} min • {rule.target_type}: {rule.target_value}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          rule.active
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {rule.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => startEditRule(rule)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}