import type { Membership, User } from '@/types'

import { http } from './api'

export interface AuthSession {
  user: User
  memberships: Membership[]
}

// Não há cadastro público: contas nascem por convite (ver services/team.ts).
export const authService = {
  login: (input: { email: string; password: string }) =>
    http.post<AuthSession & { token: string }>('/auth/login', input, false),
  me: () => http.get<AuthSession>('/auth/me'),
  logout: () => http.post<void>('/auth/logout'),
}
