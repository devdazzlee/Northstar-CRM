'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AuthMembershipDto,
  AuthOrganizationDto,
  AuthUserDto,
} from '@/lib/api/auth'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUserDto | null
  organization: AuthOrganizationDto | null
  membership: AuthMembershipDto | null
  hydrated: boolean
  setHydrated: (value: boolean) => void
  setSession: (input: {
    accessToken: string
    refreshToken: string
    user: AuthUserDto
    organization: AuthOrganizationDto
    membership: AuthMembershipDto
  }) => void
  setTokens: (input: { accessToken: string; refreshToken: string }) => void
  setProfile: (input: {
    user: AuthUserDto
    organization: AuthOrganizationDto
    membership: AuthMembershipDto
  }) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      organization: null,
      membership: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setSession: ({ accessToken, refreshToken, user, organization, membership }) =>
        set({ accessToken, refreshToken, user, organization, membership }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setProfile: ({ user, organization, membership }) => set({ user, organization, membership }),
      clearSession: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          organization: null,
          membership: null,
        })
        // Ensure persisted auth is removed even if persist flush is delayed.
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('northstar-auth')
        }
      },
    }),
    {
      name: 'northstar-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        organization: state.organization,
        membership: state.membership,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)

export function useIsAuthenticated() {
  return Boolean(useAuthStore((s) => s.accessToken))
}
