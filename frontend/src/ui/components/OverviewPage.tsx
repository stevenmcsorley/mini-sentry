import { useState } from 'react'
import { LevelBadge } from './LevelBadge'
import { AlertRuleForm } from './forms/AlertRuleForm'
import { DeploymentForm } from './forms/DeploymentForm'
import { ReleaseForm } from './forms/ReleaseForm'
import { ArtifactForm } from './forms/ArtifactForm'
import { AddTargetForm } from './forms/AddTargetForm'
import { api } from '../utils/api.utils'

// Import types
import type { 
  Project, 
  Release, 
  Deployment, 
  AlertRule, 
  Group,
  TimeRange,
  TimeInterval 
} from '../types/app.types'

// All form components now imported from forms/ directory
// - ReleaseForm now imported from forms/ReleaseForm
// - DeploymentForm now imported from forms/DeploymentForm  
// - ArtifactForm now imported from forms/ArtifactForm
// - AddTargetForm now imported from forms/AddTargetForm

interface OverviewPageProps {
  selected: Project
  releases: Release[]
  createRelease: (version: string, env: string) => void
  deploys: Deployment[]
  createDeployment: (name: string, url: string, env: string, releaseId?: number) => void
  sessionUser: string
  setSessionUser: (user: string) => void
  sendSession: (status: 'init'|'ok'|'errored'|'crashed'|'exited') => void
  range: TimeRange
  setRange: (r: TimeRange) => void
  interval: TimeInterval
  setInterval: (i: TimeInterval) => void
  refreshSeries: () => void
  series: any[]
  health: any[]
  rules: AlertRule[]
  createRule: (name: string, level: string, threshold: number, targetType: 'email'|'webhook', targetValue: string) => void
  editRule: {threshold: number; window: number; notify: number}
  setEditRule: (rule: {threshold: number; window: number; notify: number}) => void
  updateFirstRule: () => void
  groups: Group[]
  setGroups: (groups: Group[]) => void
  snoozeGroup: (groupId: number, minutes?: number) => void
}

export function OverviewPage({
  selected,
  releases,
  createRelease,
  deploys,
  createDeployment,
  sessionUser,
  setSessionUser,
  sendSession,
  range,
  setRange,
  interval,
  setInterval,
  refreshSeries,
  series,
  health,
  rules,
  createRule,
  editRule,
  setEditRule,
  updateFirstRule,
  groups,
  setGroups,
  snoozeGroup,
}: OverviewPageProps) {
  const [assignModal, setAssignModal] = useState<{groupId: number, currentAssignee: string} | null>(null)
  const [commentModal, setCommentModal] = useState<{groupId: number} | null>(null)
  const [selectedRelease, setSelectedRelease] = useState<number | null>(null)

  return (
    <div data-testid="overview-page" className="space-y-6">
      {/* Project Header */}
      <div data-testid="overview-header" className="rounded-xl border border-slate-800/60 bg-gradient-to-r from-slate-800/30 to-slate-700/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="project-title">{selected.name}</h1>
            <p className="text-slate-300" data-testid="project-description">
              Project management hub for releases, deployments, health monitoring, and issue management
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-4 py-2" data-testid="project-info">
            <div className="text-xs text-slate-400">Project Slug</div>
            <div className="font-mono text-sm text-slate-200">{selected.slug}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div data-testid="quick-actions" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center hover:bg-slate-800/40 transition-colors">
          <div className="text-2xl font-bold text-blue-400" data-testid="releases-count">{releases.length}</div>
          <div className="text-sm text-slate-300">Active Releases</div>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center hover:bg-slate-800/40 transition-colors">
          <div className="text-2xl font-bold text-green-400" data-testid="deployments-count">{deploys.length}</div>
          <div className="text-sm text-slate-300">Deployments</div>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center hover:bg-slate-800/40 transition-colors">
          <div className="text-2xl font-bold text-orange-400" data-testid="alert-rules-count">{rules.length}</div>
          <div className="text-sm text-slate-300">Alert Rules</div>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center hover:bg-slate-800/40 transition-colors">
          <div className="text-2xl font-bold text-red-400" data-testid="open-groups-count">{groups.length}</div>
          <div className="text-sm text-slate-300">Open Issues</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Release Management */}
        <section data-testid="releases-section" className="rounded-xl border border-slate-800/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">Release Management</h3>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
              {releases.length}
            </span>
          </div>

          {/* Create Release Form - single row */}
          <div className="mb-4" data-testid="release-form">
            <ReleaseForm onCreate={createRelease} />
          </div>

          {/* Releases List */}
          {releases.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-2">No releases yet</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto" data-testid="releases-table">
              {releases.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
                  data-testid={`release-${r.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-white">{r.version}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      r.environment === 'production'
                        ? 'bg-green-500/20 text-green-300'
                        : r.environment === 'staging'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {r.environment}
                    </span>
                    <span className="text-xs text-slate-500">{r.created_at}</span>
                  </div>
                  <button
                    onClick={() => setSelectedRelease(selectedRelease === r.id ? null : r.id)}
                    className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                  >
                    {selectedRelease === r.id ? 'Hide' : 'Artifacts'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Artifact Upload */}
          {selectedRelease && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <ArtifactForm releaseId={selectedRelease} onUpload={() => setSelectedRelease(null)} />
            </div>
          )}
        </section>

        {/* Deployment Management */}
        <section data-testid="deployments-section" className="rounded-xl border border-slate-800/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">Deployment Tracking</h3>
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-300">
              {deploys.length}
            </span>
          </div>

          {/* Create Deployment Form - single row */}
          <div className="mb-4" data-testid="deployment-form">
            <DeploymentForm onCreate={createDeployment} />
          </div>

          {/* Deployments List */}
          {deploys.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-2">No deployments yet</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto" data-testid="deployments-table">
              {deploys.map(d => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
                  data-testid={`deployment-${d.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white">{d.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      d.environment === 'production'
                        ? 'bg-green-500/20 text-green-300'
                        : d.environment === 'staging'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {d.environment}
                    </span>
                    <span className="text-xs text-slate-500">{d.date_started}</span>
                  </div>
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 truncate max-w-[120px]"
                      title={d.url}
                    >
                      {d.url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Release Health */}
        <section data-testid="release-health-section" className="rounded-xl border border-slate-800/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Release Health</h3>
            <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
              Health monitoring
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Monitor application stability through session tracking and crash-free percentages.
          </p>
          
          {/* Session Testing */}
          <div className="mb-4 rounded border border-slate-700/50 bg-slate-800/30 p-3" data-testid="session-testing">
            <div className="mb-2 text-xs font-medium text-slate-300">Test Session Data</div>
            <div className="flex flex-wrap items-center gap-2">
              <input 
                data-testid="session-user-input"
                value={sessionUser} 
                onChange={e => setSessionUser(e.target.value)} 
                placeholder="user id" 
                className="rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
              />
              <button 
                data-testid="send-ok-session"
                className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                onClick={() => sendSession('ok')}
              >
                Send ok session
              </button>
              <button 
                data-testid="send-crashed-session"
                className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                onClick={() => sendSession('crashed')}
              >
                Send crashed session
              </button>
            </div>
          </div>

          {/* Health Data Controls */}
          <div className="mb-3 flex flex-wrap items-center gap-2" data-testid="health-controls">
            <label className="text-xs text-slate-400">Range</label>
            <select 
              data-testid="health-range-select"
              className="rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
              value={range} 
              onChange={e => setRange(e.target.value as any)}
            >
              <option value="1h">1h</option>
              <option value="24h">24h</option>
            </select>
            <label className="text-xs text-slate-400">Interval</label>
            <select 
              data-testid="health-interval-select"
              className="rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
              value={interval} 
              onChange={e => setInterval(e.target.value as any)}
            >
              <option value="5m">5m</option>
              <option value="1h">1h</option>
            </select>
            <button 
              data-testid="refresh-health"
              className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
              onClick={refreshSeries}
            >
              Refresh
            </button>
          </div>

          {/* Health Tables */}
          <div className="space-y-4">
            {series.length > 0 && (
              <div data-testid="health-series-table">
                <div className="text-xs font-medium text-slate-300 mb-2">Time Series Data</div>
                <div className="max-h-32 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-slate-400">
                      <tr><th>Bucket</th><th>Total</th><th>Crashed</th><th>Crash-free %</th></tr>
                    </thead>
                    <tbody>
                      {series.map((b, idx) => (
                        <tr key={idx} className="border-t border-slate-800/60">
                          <td className="py-1">{b.bucket}</td>
                          <td>{b.total}</td>
                          <td>{b.crashed}</td>
                          <td>{b.total === 0 ? 100 : Math.round(100 * (b.total - b.crashed) / b.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {health.length > 0 && (
              <div data-testid="health-summary-table">
                <div className="text-xs font-medium text-slate-300 mb-2">Release Health Summary</div>
                <div className="max-h-32 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-slate-400">
                      <tr><th>Version</th><th>Env</th><th>Total</th><th>Crashed</th><th>Crash-free %</th></tr>
                    </thead>
                    <tbody>
                      {health.map((h, idx) => (
                        <tr key={idx} className="border-t border-slate-800/60">
                          <td className="py-1">{h.version}</td>
                          <td>{h.environment}</td>
                          <td>{h.total_sessions}</td>
                          <td>{h.crashed_sessions}</td>
                          <td>{h.crash_free_rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Alert Rules */}
        <section data-testid="alert-rules-section" className="rounded-xl border border-slate-800/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Alert Management</h3>
            <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs text-orange-300">
              {rules.length} rules
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Configure automated alerts for error thresholds with email or webhook notifications.
          </p>
          
          <div data-testid="alert-rule-form">
            <AlertRuleForm onCreate={createRule} />
          </div>
          
          {rules.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="rounded border border-slate-700/50 bg-slate-800/30 p-3" data-testid="alert-rule-editor">
                <div className="mb-2 text-xs font-medium text-slate-300">Edit First Rule</div>
                <div className="flex items-center gap-2">
                  <input 
                    data-testid="rule-threshold-input"
                    type="number" 
                    value={editRule.threshold} 
                    onChange={e => setEditRule({...editRule, threshold: parseInt(e.target.value)})} 
                    placeholder="threshold" 
                    className="w-20 rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
                  />
                  <input 
                    data-testid="rule-window-input"
                    type="number" 
                    value={editRule.window} 
                    onChange={e => setEditRule({...editRule, window: parseInt(e.target.value)})} 
                    placeholder="window (min)" 
                    className="w-24 rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
                  />
                  <input 
                    data-testid="rule-notify-input"
                    type="number" 
                    value={editRule.notify} 
                    onChange={e => setEditRule({...editRule, notify: parseInt(e.target.value)})} 
                    placeholder="notify (min)" 
                    className="w-24 rounded border border-slate-700 bg-transparent px-2 py-1 text-xs" 
                  />
                  <button 
                    data-testid="update-rule-button"
                    className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                    onClick={updateFirstRule}
                  >
                    Update
                  </button>
                </div>
              </div>
              
              <div data-testid="alert-targets-form">
                <AddTargetForm ruleId={rules[0].id} onAdded={() => api(`/api/alert-rules/?project=${selected!.slug}/`).then(setRules)} />
              </div>
            </div>
          )}
          
          <div className="mt-4 max-h-40 overflow-y-auto" data-testid="alert-rules-table">
            <table className="w-full text-xs">
              <thead className="text-left text-slate-400">
                <tr><th>Name</th><th>Level</th><th>Threshold</th><th>Target</th></tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id} className="border-t border-slate-800/60" data-testid={`alert-rule-${r.id}`}>
                    <td className="py-1">{r.name}</td>
                    <td>{r.level || 'any'}</td>
                    <td>{r.threshold_count}</td>
                    <td className="truncate max-w-32">{r.target_type}: {r.target_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Issue Groups */}
      <section data-testid="groups-section" className="rounded-xl border border-slate-800/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Issue Management</h3>
          <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
            {groups.length} open issues
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Manage and triage error groups with resolve, ignore, assign, and comment actions.
        </p>
        
        <div className="overflow-x-auto" data-testid="groups-table">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr><th>Last Seen</th><th>Level</th><th>Title</th><th>Count</th><th>Status</th><th>Assignee</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id} className="border-t border-slate-800/60" data-testid={`group-${g.id}`}>
                  <td className="py-2">{g.last_seen}</td>
                  <td><LevelBadge level={g.level} /></td>
                  <td className="max-w-64 truncate">{g.title}</td>
                  <td>{g.count}</td>
                  <td className="text-xs">
                    {g.status === 'resolved' ? (
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full">resolved</span>
                    ) : g.status === 'ignored' ? (
                      <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">ignored</span>
                    ) : (
                      <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full">open</span>
                    )}
                  </td>
                  <td className="text-xs">
                    {g.assignee ? (
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">{g.assignee}</span>
                    ) : (
                      <span className="text-slate-500">unassigned</span>
                    )}
                  </td>
                  <td className="space-x-1">
                    <button 
                      data-testid={`resolve-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => api(`/api/groups/${g.id}/resolve/`, {method:'POST'}).then(()=>api(`/api/groups/?project=${selected!.slug}/`).then(setGroups))}
                    >
                      Resolve
                    </button>
                    <button 
                      data-testid={`unresolve-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => api(`/api/groups/${g.id}/unresolve/`, {method:'POST'}).then(()=>api(`/api/groups/?project=${selected!.slug}/`).then(setGroups))}
                    >
                      Unresolve
                    </button>
                    <button 
                      data-testid={`ignore-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => api(`/api/groups/${g.id}/ignore/`, {method:'POST'}).then(()=>api(`/api/groups/?project=${selected!.slug}/`).then(setGroups))}
                    >
                      Ignore
                    </button>
                    <button 
                      data-testid={`assign-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => setAssignModal({groupId: g.id, currentAssignee: g.assignee || ''})}
                    >
                      Assign
                    </button>
                    <button 
                      data-testid={`comment-group-${g.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                      onClick={() => setCommentModal({groupId: g.id})}
                    >
                      Comment
                    </button>
                    {rules.length > 0 ? (
                      <button 
                        data-testid={`snooze-group-${g.id}`}
                        className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800/60" 
                        onClick={() => snoozeGroup(g.id, 60)}
                      >
                        Snooze
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assignment Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Assign Issue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Assign to user:</label>
                <input
                  type="text"
                  placeholder="Enter username or email"
                  defaultValue={assignModal.currentAssignee}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const assignee = (e.target as HTMLInputElement).value;
                      api(`/api/groups/${assignModal.groupId}/assign/`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({assignee})
                      }).then(() => {
                        api(`/api/groups/?project=${selected!.slug}/`).then(setGroups);
                        setAssignModal(null);
                      });
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">Press Enter to assign, or leave empty to unassign</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 text-sm border border-slate-600 rounded hover:bg-slate-700"
                  onClick={() => setAssignModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
                  onClick={() => {
                    const input = document.querySelector('.fixed input') as HTMLInputElement;
                    const assignee = input?.value || '';
                    api(`/api/groups/${assignModal.groupId}/assign/`, {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({assignee})
                    }).then(() => {
                      api(`/api/groups/?project=${selected!.slug}/`).then(setGroups);
                      setAssignModal(null);
                    });
                  }}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {commentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Add Comment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Comment:</label>
                <textarea
                  placeholder="Enter your comment..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm h-24 resize-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 text-sm border border-slate-600 rounded hover:bg-slate-700"
                  onClick={() => setCommentModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded text-white"
                  onClick={() => {
                    const textarea = document.querySelector('.fixed textarea') as HTMLTextAreaElement;
                    const body = textarea?.value || '';
                    if (body.trim()) {
                      api(`/api/groups/${commentModal.groupId}/comments/`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({author: 'ui', body})
                      }).then(() => {
                        setCommentModal(null);
                        // Show success notification
                        const notification = document.createElement('div');
                        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
                        notification.textContent = 'Comment added successfully!';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 3000);
                      });
                    }
                  }}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}