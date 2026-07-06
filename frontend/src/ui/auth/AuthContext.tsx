import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getToken,
  setToken,
  clearToken,
  fetchMe,
  login as apiLogin,
  register as apiRegister,
  fetchWorkspaces,
  getWorkspaceId,
  setWorkspaceId,
  clearWorkspaceId,
  type AuthUser,
  type Workspace,
} from '../../services/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
  switchWorkspace: (id: number) => void
  refreshWorkspaces: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)

  const loadWorkspaces = async () => {
    const list = await fetchWorkspaces()
    const stored = getWorkspaceId()
    const current = list.find(w => String(w.id) === stored) ?? list[0] ?? null
    if (current) setWorkspaceId(current.id)
    else clearWorkspaceId()
    setWorkspaces(list)
    setCurrentWorkspace(current)
  }

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe()
      .then(async u => {
        setUser(u)
        await loadWorkspaces()
      })
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      clearToken()
      setUser(null)
    }
    window.addEventListener('skylark:unauthorized', onUnauthorized)
    return () => window.removeEventListener('skylark:unauthorized', onUnauthorized)
  }, [])

  const login = async (email: string, password: string) => {
    const { access, user } = await apiLogin(email, password)
    setToken(access)
    setUser(user)
    await loadWorkspaces()
  }

  const register = async (email: string, name: string, password: string) => {
    const { access, user } = await apiRegister(email, name, password)
    setToken(access)
    setUser(user)
    await loadWorkspaces()
  }

  const logout = () => {
    clearToken()
    clearWorkspaceId()
    setUser(null)
  }

  const switchWorkspace = (id: number) => {
    setWorkspaceId(id)
    // Simple + correct: reload so every hook refetches for the new workspace.
    window.location.reload()
  }

  const refreshWorkspaces = async () => {
    await loadWorkspaces()
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, workspaces, currentWorkspace, login, register, logout, switchWorkspace, refreshWorkspaces }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
