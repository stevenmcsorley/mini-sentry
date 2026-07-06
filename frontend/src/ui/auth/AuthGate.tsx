import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { LoginPage } from './LoginPage'
import { InviteAccept } from './InviteAccept'

function inviteToken(): string | null {
  const m = window.location.pathname.match(/^\/invite\/([^/]+)/)
  return m ? m[1] : null
}

/** Renders invite-accept for /invite/<token>, otherwise the login screen
 *  until the user is authenticated. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  const token = inviteToken()
  if (token) {
    return <InviteAccept token={token} />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <>{children}</>
}
