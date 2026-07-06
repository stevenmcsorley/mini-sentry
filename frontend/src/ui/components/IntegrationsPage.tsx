import { useEffect, useState } from 'react'
import { api } from '../utils/api.utils'

interface Integration {
  id: number
  provider: string
  config: Record<string, string | number>
  created_at: string
}

interface IntegrationsResponse {
  integrations: Integration[]
  available: Record<string, string[]>
}

// Human labels + helper text for each config field, per provider.
const FIELD_META: Record<string, { label: string; placeholder: string; hint?: string }> = {
  owner: { label: 'Owner', placeholder: 'stevenmcsorley', hint: 'GitHub user or org' },
  repo: { label: 'Repository', placeholder: 'mini-sentry' },
  token: { label: 'Token', placeholder: '••••••••', hint: 'Stored server-side, shown redacted after saving' },
  url: { label: 'Base URL', placeholder: 'https://ossicone.halfagiraf.com' },
  project_id: { label: 'Project ID', placeholder: '3', hint: 'Numeric Ossicone project id' },
  reporter_id: { label: 'Reporter ID', placeholder: '1', hint: 'Ossicone user id to file tickets as' },
}

const PROVIDER_META: Record<string, { name: string; blurb: string }> = {
  github: { name: 'GitHub Issues', blurb: 'Open a GitHub issue from any error group.' },
  ossicone: { name: 'Ossicone', blurb: 'File an Ossicone bug ticket from any error group.' },
}

export function IntegrationsPage() {
  const [data, setData] = useState<IntegrationsResponse>({ integrations: [], available: {} })
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const load = () =>
    api('/api/integrations/')
      .then(setData)
      .catch(() => setData({ integrations: [], available: {} }))
  useEffect(() => { load() }, [])

  const configured = (provider: string) => data.integrations.find(i => i.provider === provider)

  const setField = (provider: string, field: string, value: string) =>
    setDrafts(d => ({ ...d, [provider]: { ...(d[provider] || {}), [field]: value } }))

  const save = async (provider: string) => {
    setError(null); setSaved(null); setBusy(provider)
    try {
      const config = drafts[provider] || {}
      await api('/api/integrations/', { method: 'POST', body: JSON.stringify({ provider, config }) })
      setDrafts(d => ({ ...d, [provider]: {} }))
      setSaved(provider)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save integration')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (provider: string) => {
    if (!window.confirm(`Remove the ${PROVIDER_META[provider]?.name || provider} integration?`)) return
    await api(`/api/integrations/${provider}/`, { method: 'DELETE' }).catch(() => {})
    load()
  }

  const card = 'rounded-xl border border-slate-800/60 bg-slate-900/40 p-6'

  return (
    <div className="space-y-6" data-testid="integrations-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Integrations</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Connect an issue tracker so you can turn an error group into a ticket — from the UI, the API, or
          the <span className="text-slate-200">MCP</span> agent. New providers plug in via the adapter pattern
          on the backend; nothing else changes.
        </p>
      </div>

      {error && <p className="text-sm text-red-400" data-testid="integrations-error">{error}</p>}

      {Object.entries(data.available).map(([provider, fields]) => {
        const existing = configured(provider)
        const meta = PROVIDER_META[provider] || { name: provider, blurb: '' }
        return (
          <div key={provider} className={card} data-testid={`integration-${provider}`}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{meta.name}</h2>
                <p className="text-sm text-slate-400">{meta.blurb}</p>
              </div>
              {existing ? (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">Connected</span>
              ) : (
                <span className="rounded-full bg-slate-700/40 px-3 py-1 text-xs text-slate-400">Not connected</span>
              )}
            </div>

            {existing && (
              <div className="mb-4 rounded-lg border border-slate-800/60 bg-slate-950/40 p-3 text-xs">
                <div className="mb-1 uppercase tracking-wide text-slate-500">Current config</div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-slate-300">
                  {Object.entries(existing.config).map(([k, v]) => (
                    <span key={k}>{k}=<span className="text-slate-100">{String(v)}</span></span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map(field => {
                const fm = FIELD_META[field] || { label: field, placeholder: '' }
                return (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-slate-300">{fm.label}</label>
                    <input
                      value={drafts[provider]?.[field] ?? ''}
                      onChange={e => setField(provider, field, e.target.value)}
                      placeholder={existing ? '(unchanged)' : fm.placeholder}
                      type={field === 'token' ? 'password' : 'text'}
                      className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                      data-testid={`field-${provider}-${field}`}
                    />
                    {fm.hint && <p className="mt-1 text-[11px] text-slate-500">{fm.hint}</p>}
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => save(provider)}
                disabled={busy === provider}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                data-testid={`save-${provider}`}
              >
                {busy === provider ? 'Saving…' : existing ? 'Update' : 'Connect'}
              </button>
              {existing && (
                <button
                  onClick={() => remove(provider)}
                  className="text-sm text-red-400 hover:text-red-300"
                  data-testid={`remove-${provider}`}
                >
                  Remove
                </button>
              )}
              {saved === provider && <span className="text-sm text-emerald-400">Saved ✓</span>}
            </div>
          </div>
        )
      })}

      <p className="text-xs text-slate-500">
        Once connected, open a ticket from an error group under <span className="text-slate-400">Issues</span>,
        or let the agent do it (<code className="text-slate-400">create_github_issue</code>,{' '}
        <code className="text-slate-400">create_ossicone_ticket</code>). Tokens are stored server-side and shown
        redacted.
      </p>
    </div>
  )
}
