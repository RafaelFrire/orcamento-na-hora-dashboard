import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { session, setUnauthorizedListener } from '@/services/api'
import { authService, type AuthSession } from '@/services/auth'
import type { Membership, User } from '@/types'

interface AuthState {
  user: User | null
  membership: Membership | null
  isPlatformAdmin: boolean
  /** true enquanto valida o token salvo ao abrir o app. */
  initializing: boolean
  login(email: string, password: string): Promise<void>
  /** Inicia a sessão a partir de uma resposta que já traz token (aceite de convite). */
  startSession(res: AuthSession & { token: string }): void
  logout(): Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function pickMembership(memberships: Membership[]) {
  const saved = session.getOrganizationId()
  return memberships.find((m) => m.organizationId === saved) ?? memberships[0] ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [initializing, setInitializing] = useState(() => !!session.getToken())

  const apply = useCallback((s: AuthSession) => {
    const m = pickMembership(s.memberships)
    session.setOrganizationId(m?.organizationId ?? null)
    setUser(s.user)
    setMembership(m)
  }, [])

  const clear = useCallback(() => {
    session.clear()
    setUser(null)
    setMembership(null)
  }, [])

  // Restaura a sessão a partir do token salvo.
  useEffect(() => {
    if (!session.getToken()) return
    let alive = true
    authService
      .me()
      .then((s) => alive && apply(s))
      .catch(() => alive && clear())
      .finally(() => alive && setInitializing(false))
    return () => {
      alive = false
    }
  }, [apply, clear])

  // Qualquer 401 em rota protegida encerra a sessão.
  useEffect(() => {
    setUnauthorizedListener(clear)
    return () => setUnauthorizedListener(null)
  }, [clear])

  const value = useMemo<AuthState>(
    () => ({
      user,
      membership,
      isPlatformAdmin: !!user?.isPlatformAdmin,
      initializing,
      async login(email, password) {
        const res = await authService.login({ email, password })
        session.setToken(res.token)
        if (res.memberships.length === 0 && !res.user.isPlatformAdmin) {
          // Sem empresa (acesso suspenso ou ainda sem vínculo): não há onde trabalhar.
          clear()
          throw new Error('NO_MEMBERSHIP')
        }
        apply(res)
      },
      startSession(res) {
        session.setToken(res.token)
        apply(res)
      },
      async logout() {
        try {
          await authService.logout()
        } catch {
          /* o logout é stateless no servidor; limpar localmente basta */
        }
        clear()
      },
    }),
    [user, membership, initializing, apply, clear],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
