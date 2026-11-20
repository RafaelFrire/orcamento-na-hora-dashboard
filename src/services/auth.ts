import type { Membership, User } from '@/types'

import { http } from './api'

export interface AuthSession {
  user: User
  memberships: Membership[]
}

export const authService = {
  register: (input: { name: string; email: string; password: string }) =>
    http.post<{ user: User }>('/auth/register', input, false),
  login: (input: { email: string; password: string }) =>
    http.post<AuthSession & { token: string }>('/auth/login', input, false),
  me: () => http.get<AuthSession>('/auth/me'),
  logout: () => http.post<void>('/auth/logout'),
  createOrganization: (name: string) =>
    http.post<{ organization: { id: string; name: string; slug: string } }>('/organizations', { name }),
}
