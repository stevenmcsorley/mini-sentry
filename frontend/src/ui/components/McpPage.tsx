import { useEffect, useState } from 'react'
import { api } from '../utils/api.utils'

interface TokenRow {
  id: number
  name: string
  token_preview?: string
  last_used_at?: string | null
  created_at?: string
}

const TOOL_GROUPS: Array<[string, string]> = [
  ['Projects', 'list_projects · create_project'],
  ['Error groups', 'list_issues · get_issue · resolve / unresolve / ignore / assign / comment'],
  ['Events', 'list_events · get_event'],
  ['Stats', 'top_issues · event_series'],
  ['Releases & alerts', 'list_releases · list_alert_rules'],
  ['Workspace', 'get_workspace · list_workspaces'],
  ['Testing', 'send_test_event'],
]

export function McpPage() {
  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [name, setName] = useState('')
  const [newToken, setNewToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const base = window.location.origin

  const load = () => api('/api/tokens/').then(setTokens).catch(() => setTokens([]))
  useEffect(() => { load() }, [])

  const create = async () => {
    setError(null)
    setNewToken(null)
    try {
      const t = await api('/api/tokens/', { method: 'POST', body: JSON.stringify({ name: name.trim() || 'MCP token' }) })
      setNewToken(t.token)
      setName('')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create token')
    }
  }

  const revoke = async (id: number) => {
    if (!window.confirm('Revoke this token? Any MCP or CI using it will stop working.')) return
    await api(`/api/tokens/${id}/`, { method: 'DELETE' }).catch(() => {})
    load()
  }

  const command = (token: string) =>
    `claude mcp add skylark --scope user \\\n  -e SKYLARK_URL=${base} \\\n  -e SKYLARK_TOKEN=${token} \\\n  -- node /path/to/mini-sentry/mcp/index.js`

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const card = 'rounded-xl border border-slate-800/60 bg-slate-900/40 p-6'
  const pre = 'mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200'

  return (
    <div className="space-y-6" data-testid="mcp-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">AI Agent (MCP)</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Skylark ships a <span className="text-slate-200">Model Context Protocol</span> server so an AI agent
          (Claude Code, etc.) can triage and manage your errors directly — list and resolve issues, inspect
          events, read trends, and send test events. It authenticates with a scoped API token below.
        </p>
      </div>

      {/* Connect */}
      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold text-white">Connect an agent</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Token name (e.g. claude-code)"
            className="w-64 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={create}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Create API token
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {newToken && (
          <div className="mt-4 rounded-lg border border-amber-800/60 bg-amber-950/30 p-4">
            <p className="text-sm font-medium text-amber-200">Copy this token now — it won't be shown again.</p>
            <code className="mt-2 block break-all rounded bg-slate-950 p-2 text-xs text-amber-100">{newToken}</code>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Register with Claude Code</p>
            <pre className={pre}>{command(newToken)}</pre>
            <button
              onClick={() => copy(command(newToken))}
              className="mt-2 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              {copied ? 'Copied ✓' : 'Copy command'}
            </button>
          </div>
        )}
      </div>

      {/* What you can do */}
      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold text-white">What the agent can do</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOOL_GROUPS.map(([group, tools]) => (
            <div key={group} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
              <div className="text-sm font-medium text-slate-200">{group}</div>
              <div className="mt-1 text-xs text-slate-400">{tools}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Existing tokens */}
      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold text-white">Active tokens</h2>
        {tokens.length === 0 ? (
          <p className="text-sm text-slate-400">No tokens yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2">Token</th>
                <th className="pb-2">Last used</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tokens.map(t => (
                <tr key={t.id}>
                  <td className="py-2 text-slate-200">{t.name}</td>
                  <td className="py-2 font-mono text-xs text-slate-400">{t.token_preview}</td>
                  <td className="py-2 text-xs text-slate-400">{t.last_used_at ? new Date(t.last_used_at).toLocaleString() : 'never'}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => revoke(t.id)} className="text-xs text-red-400 hover:text-red-300">Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Tokens are scoped to this workspace. The MCP server lives in <code className="text-slate-400">mini-sentry/mcp</code>{' '}
          (run <code className="text-slate-400">npm install</code> once). You can also pass{' '}
          <code className="text-slate-400">SKYLARK_EMAIL</code> + <code className="text-slate-400">SKYLARK_PASSWORD</code> instead of a token.
        </p>
      </div>
    </div>
  )
}
