import type { MemberRole } from '@/types'

import { http } from './api'
import type { InviteResult, TeamData, TicketType } from './team'

export interface AdminOrganization {
  id: string
  name: string
  slug: string
  plan: string
  planLabel: string
  trialEndsAt: string | null
  createdAt: string
  seats: { active: number; pending: number; limit: number }
}

export interface AdminTicket {
  id: string
  type: TicketType
  urgent: boolean
  message: string | null
  createdAt: string
  organization: { id: string; name: string }
  createdBy: { id: string; name: string; email: string } | null
  target: { id: string; name: string; email: string } | null
}

export const adminService = {
  organizations: (q?: string) => http.get<{ organizations: AdminOrganization[] }>('/admin/organizations', { q }),
  createOrganization: (input: { name: string; niche?: string; ownerName: string; ownerEmail: string }) =>
    http.post<InviteResult & { organization: { id: string; name: string } }>('/admin/organizations', input),
  team: (orgId: string) => http.get<TeamData>(`/admin/organizations/${orgId}/team`),
  invite: (orgId: string, input: { name: string; email: string; role: MemberRole }) =>
    http.post<InviteResult>(`/admin/organizations/${orgId}/invitations`, input),
  regenerate: (orgId: string, id: string) =>
    http.post<InviteResult>(`/admin/organizations/${orgId}/invitations/${id}/regenerate`),
  revoke: (orgId: string, id: string) => http.delete<void>(`/admin/organizations/${orgId}/invitations/${id}`),
  updateMember: (orgId: string, userId: string, input: { disabled?: boolean; role?: 'OWNER' | 'MEMBER' }) =>
    http.patch<TeamData>(`/admin/organizations/${orgId}/members/${userId}`, input),
  resetAccess: (orgId: string, userId: string) =>
    http.post<{ token: string; expiresAt: string }>(`/admin/organizations/${orgId}/members/${userId}/reset-access`),
  tickets: () => http.get<{ tickets: AdminTicket[] }>('/admin/tickets'),
  resolveTicket: (id: string, note?: string) => http.post<unknown>(`/admin/tickets/${id}/resolve`, { note }),
}
