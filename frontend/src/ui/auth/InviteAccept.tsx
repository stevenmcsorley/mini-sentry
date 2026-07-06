import { useEffect, useState, type FormEvent } from 'react'
import { inspectInvite, acceptInvite, setToken } from '../../services/auth'

interface InviteInfo {
  workspace_name: string
  email: string
  role: string
  account_exists: boolean
  accepted: boolean
  expired: boolean
}

export function InviteAccept({ token }: { token: string }) {
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    inspectInvite(token)
      .then(setInfo)
      .catch(e => setError(e instanceof Error ? e.message : 'Invite not found'))
      .finally(() => setLoading(false))
  }, [token])

  const accept = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await acceptInvite(token, info?.account_exists ? { password } : { name, password })
      setToken(res.access)
      window.location.assign('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept')
      setSubmitting(false)
    }
  }

  const input = 'w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Skylark</h1>
          <p className="mt-1 text-sm text-slate-400">Workspace invitation</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : error && !info ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : info?.accepted ? (
            <p className="text-sm text-slate-300">
              This invite has already been used. <a href="/" className="text-emerald-400">Go to sign in</a>
            </p>
          ) : info?.expired ? (
            <p className="text-sm text-slate-300">This invite has expired.</p>
          ) : (
            <form onSubmit={accept} className="space-y-4">
              <p className="text-sm text-slate-300">
                You&apos;ve been invited to join{' '}
                <span className="font-medium text-white">{info?.workspace_name}</span> as{' '}
                <span className="text-white">{info?.role}</span> ({info?.email}).
              </p>
              {error && <div className="rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</div>}
              {!info?.account_exists && (
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Your name</label>
                  <input className={input} value={name} onChange={e => setName(e.target.value)} required minLength={2} />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  {info?.account_exists ? 'Your password' : 'Choose a password'}
                </label>
                <input type="password" className={input} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" disabled={submitting} className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                {submitting ? 'Joining…' : 'Accept invite'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
