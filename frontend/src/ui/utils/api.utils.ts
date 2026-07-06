import { getToken, getWorkspaceId, clearToken } from '../../services/auth'

/** App-wide fetch helper: attaches the JWT + workspace headers and drops to
 *  login on 401. Used across the UI for all authenticated API calls. */
export const api = async (path: string, opts?: RequestInit) => {
  const token = getToken()
  const workspaceId = getWorkspaceId()
  const headers: Record<string, string> = {
    ...(opts?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {}),
    ...(opts?.headers as Record<string, string> | undefined),
  }
  const res = await fetch(path, { ...opts, headers })

  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new Event('skylark:unauthorized'))
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API Error ${res.status}: ${text}`)
  }

  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  } else {
    const text = await res.text()
    throw new Error(`Expected JSON but got: ${text.substring(0, 100)}...`)
  }
}
