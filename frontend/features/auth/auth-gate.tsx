'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { LoginPage } from '@/features/auth/login-page'
import { meApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth-store'

type AuthGateProps = {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const hydrated = useAuthStore((s) => s.hydrated)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setProfile = useAuthStore((s) => s.setProfile)
  const clearSession = useAuthStore((s) => s.clearSession)
  const setHydrated = useAuthStore((s) => s.setHydrated)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const finish = () => setHydrated(true)
    const unsub = useAuthStore.persist.onFinishHydration(finish)
    if (useAuthStore.persist.hasHydrated()) finish()
    return unsub
  }, [setHydrated])

  useEffect(() => {
    if (!hydrated) return

    let cancelled = false

    async function validate() {
      const token = useAuthStore.getState().accessToken
      if (!token) {
        if (!cancelled) setChecking(false)
        return
      }

      if (!cancelled) setChecking(true)

      try {
        const me = await meApi()
        // If user signed out while /me was in flight, keep them logged out.
        if (cancelled || !useAuthStore.getState().accessToken) return
        setProfile({
          user: me.user,
          organization: me.organization,
          membership: me.membership,
        })
        setChecking(false)
      } catch {
        if (!cancelled) {
          clearSession()
          setChecking(false)
        }
      }
    }

    void validate()
    return () => {
      cancelled = true
    }
  }, [hydrated, accessToken, setProfile, clearSession])

  if (!hydrated || (Boolean(accessToken) && checking)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950">
        Loading workspace…
      </div>
    )
  }

  if (!accessToken) {
    return <LoginPage />
  }

  return children
}
