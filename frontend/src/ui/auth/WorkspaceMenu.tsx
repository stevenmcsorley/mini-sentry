import { useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  renameWorkspace,
  fetchMembers,
  createInvite,
  createWorkspace,
  type WorkspaceMemberInfo,
  type WorkspaceRole,
} from '../../services/auth'

export function WorkspaceMenu() {
  const { user, workspaces, currentWorkspace, switchWorkspace, refreshWorkspaces, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const canManage = currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin'
  const ownsOne = workspaces.some(w => w.role === 'owner')

  const handleCreate = async () => {
    const name = window.prompt('New workspace name')?.trim()
    if (!name) return
    try {
      const ws = await createWorkspace(name)
      switchWorkspace(ws.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create workspace')
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
      >
        <span className="max-w-[160px] truncate">{currentWorkspace?.name ?? 'Workspace'}</span>
        <svg className="h-3 w-3 opacity-70" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path d="M5.5 7.5 10 12l4.5-4.5" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
          <p className="px-3 pb-1 pt-2 text-xs uppercase text-slate-500">Workspaces</p>
          {workspaces.map(w => (
            <button
              key={w.id}
              onClick={() => {
                if (w.id !== currentWorkspace?.id) switchWorkspace(w.id)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              <span className="truncate">{w.name}</span>
              {w.id === currentWorkspace?.id && <span className="text-emerald-400">✓</span>}
            </button>
          ))}
          <div className="my-1 border-t border-slate-800" />
          {canManage && (
            <button
              onClick={() => { setSettingsOpen(true); setOpen(false) }}
              className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
            >
              Workspace settings
            </button>
          )}
          {!ownsOne && (
            <button
              onClick={handleCreate}
              className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
            >
              New workspace
            </button>
          )}
          <div className="my-1 border-t border-slate-800" />
          <div className="truncate px-3 py-1 text-xs text-slate-500">{user?.email}</div>
          <button onClick={logout} className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-800">
            Sign out
          </button>
        </div>
      )}

      {settingsOpen && (
        <WorkspaceSettings
          onClose={() => {
            setSettingsOpen(false)
            refreshWorkspaces()
          }}
        />
      )}
    </div>
  )
}

function WorkspaceSettings({ onClose }: { onClose: () => void }) {
  const { currentWorkspace, refreshWorkspaces } = useAuth()
  const [name, setName] = useState(currentWorkspace?.name ?? '')
  const [members, setMembers] = useState<WorkspaceMemberInfo[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers().then(setMembers)
  }, [])

  const save = async () => {
    setErr(null)
    try {
      await renameWorkspace(name.trim())
      await refreshWorkspaces()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  const invite = async () => {
    setErr(null)
    setInviteLink(null)
    try {
      const inv = await createInvite(inviteEmail.trim(), inviteRole)
      setInviteLink(`${window.location.origin}/invite/${inv.token}`)
      setInviteEmail('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create invite')
    }
  }

  const input = 'rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6" onMouseDown={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Workspace settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        {err && <div className="mb-3 rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">{err}</div>}

        <label className="mb-1 block text-xs uppercase text-slate-500">Name</label>
        <div className="mb-4 flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} className={`flex-1 ${input}`} />
          <button onClick={save} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Save</button>
        </div>

        <label className="mb-1 block text-xs uppercase text-slate-500">Members</label>
        <div className="mb-4 max-h-40 overflow-auto rounded-md border border-slate-800">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 text-sm text-slate-200">
              <span className="truncate">
                {m.user.name} <span className="text-slate-500">{m.user.email}</span>
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{m.role}</span>
            </div>
          ))}
        </div>

        <label className="mb-1 block text-xs uppercase text-slate-500">Invite someone</label>
        <div className="flex gap-2">
          <input placeholder="email@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className={`flex-1 ${input}`} />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value as WorkspaceRole)} className={input}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={invite} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Invite</button>
        </div>
        {inviteLink && (
          <div className="mt-3 break-all rounded-md border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-200">
            Share this link: {inviteLink}
          </div>
        )}
      </div>
    </div>
  )
}
