// Auth token storage + auth API calls (login/register/me/config).

const TOKEN_KEY = 'skylark-token'
const WORKSPACE_KEY = 'skylark-workspace'

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY)

export const getWorkspaceId = (): string | null => localStorage.getItem(WORKSPACE_KEY)
export const setWorkspaceId = (id: number | string): void => localStorage.setItem(WORKSPACE_KEY, String(id))
export const clearWorkspaceId = (): void => localStorage.removeItem(WORKSPACE_KEY)

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface Workspace {
  id: number
  name: string
  role: WorkspaceRole
  created_at?: string
}

export interface WorkspaceMemberInfo {
  id: number
  role: WorkspaceRole
  user: { id: number; email: string; name: string }
  joined_at?: string
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  const t = getToken()
  if (t) h.Authorization = `Bearer ${t}`
  const w = getWorkspaceId()
  if (w) h['X-Workspace-Id'] = w
  return h
}

async function readError(res: Response, fallback: string): Promise<string> {
  const d = await res.json().catch(() => ({}))
  return (d as { detail?: string })?.detail || fallback
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await fetch('/api/workspaces/', { headers: authHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const res = await fetch('/api/workspaces/', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name }) })
  if (!res.ok) throw new Error(await readError(res, 'Failed to create workspace'))
  return res.json()
}

export async function renameWorkspace(name: string): Promise<Workspace> {
  const res = await fetch('/api/workspaces/current/', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ name }) })
  if (!res.ok) throw new Error(await readError(res, 'Failed to rename workspace'))
  return res.json()
}

export async function fetchMembers(): Promise<WorkspaceMemberInfo[]> {
  const res = await fetch('/api/workspaces/current/members/', { headers: authHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function createInvite(email: string, role: WorkspaceRole): Promise<{ token: string; email: string; role: string }> {
  const res = await fetch('/api/workspaces/current/invites/', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ email, role }) })
  if (!res.ok) throw new Error(await readError(res, 'Failed to create invite'))
  return res.json()
}

export async function inspectInvite(token: string): Promise<{ workspace_name: string; email: string; role: string; account_exists: boolean; accepted: boolean; expired: boolean }> {
  const res = await fetch(`/api/invites/${token}/`)
  if (!res.ok) throw new Error('Invite not found')
  return res.json()
}

export async function acceptInvite(token: string, body: { name?: string; password?: string }): Promise<{ access: string; user: { id: number; email: string; name: string } }> {
  const res = await fetch(`/api/invites/${token}/accept/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await readError(res, 'Failed to accept invite'))
  return res.json()
}

export interface AuthUser {
  id: number
  email: string
  name: string
}

interface SessionResponse {
  access: string
  refresh: string
  user: AuthUser
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { detail?: string })?.detail || 'Request failed')
  }
  return data as T
}

export function login(email: string, password: string): Promise<SessionResponse> {
  return postJson<SessionResponse>('/api/auth/login/', { email, password })
}

export function register(email: string, name: string, password: string): Promise<SessionResponse> {
  return postJson<SessionResponse>('/api/auth/register/', { email, name, password })
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await fetch('/api/auth/me/', {
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
  })
  if (!res.ok) throw new Error('unauthorized')
  return res.json()
}

export async function fetchAuthConfig(): Promise<{ openSignup: boolean }> {
  try {
    const res = await fetch('/api/auth/config/')
    if (!res.ok) return { openSignup: false }
    return await res.json()
  } catch {
    return { openSignup: false }
  }
}
