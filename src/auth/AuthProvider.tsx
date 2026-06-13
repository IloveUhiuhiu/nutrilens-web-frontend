/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { request, tokenStore } from '../api/client'
import type { Profile, Tokens, UserPermissions } from '../api/types'

type AuthContextValue = {
  isAuthenticated: boolean
  profile?: Profile
  isProfileLoading: boolean
  permissions: string[]
  isSuperuser: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasToken, setHasToken] = useState(Boolean(tokenStore.access))
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => request<Profile>({ url: '/accounts/profile/', method: 'GET' }),
    enabled: hasToken,
    retry: false,
  })

  const permissionsQuery = useQuery({
    queryKey: ['my-permissions', profileQuery.data?.id],
    queryFn: () =>
      request<UserPermissions>({
        url: `/admin/accounts/${profileQuery.data!.id}/permissions/`,
      }),
    enabled: hasToken && !!profileQuery.data?.id,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: hasToken,
      profile: profileQuery.data,
      isProfileLoading: profileQuery.isFetching,
      permissions: permissionsQuery.data?.effective_permissions ?? [],
      isSuperuser: permissionsQuery.data?.is_superuser ?? false,
      login: async (email, password) => {
        const tokens = await request<Tokens>({
          url: '/accounts/login/',
          method: 'POST',
          data: { email, password },
        })
        tokenStore.set(tokens.access, tokens.refresh)
        setHasToken(true)
        await queryClient.invalidateQueries({ queryKey: ['profile'] })
      },
      logout: async () => {
        const refresh = tokenStore.refresh
        try {
          if (refresh) {
            await request<null>({ url: '/accounts/logout/', method: 'POST', data: { refresh } })
          }
        } finally {
          tokenStore.clear()
          setHasToken(false)
          queryClient.clear()
        }
      },
    }),
    [hasToken, profileQuery.data, profileQuery.isFetching, permissionsQuery.data, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
