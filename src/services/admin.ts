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
  disabledAt: string | null
  subscriptionStatus: SubscriptionStatus | null
  quotesCount: number
}

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELING' | 'EXPIRED'

export interface AdminPayment {
  id: string
  amountCents: number
  status: string
  paidAt: string | null
  createdAt: string
  planLabel: string
  organization: { id: string; name: string }
}

export interface AdminOrganizationDetail {
  id: string
  name: string
  slug: string
  niche: string | null
  plan: string
  planLabel: string
  trialEndsAt: string | null
  disabledAt: string | null
  createdAt: string
  subscription: {
    status: SubscriptionStatus
    plan: string
    planLabel: string
    priceCents: number
    currentPeriodEnd: string | null
    graceEndsAt: string | null
    canceledAt: string | null
    payments: Array<Omit<AdminPayment, 'planLabel' | 'organization'>>
  } | null
  usage: { members: number; quotes: number; customers: number; catalogItems: number }
}

export interface AdminUser {
  id: string
  name: string
  email: string
  isPlatformAdmin: boolean
  createdAt: string
  lastAccessAt: string | null
  memberships: Array<{ organizationId: string; organizationName: string; role: MemberRole; disabled: boolean }>
}

export interface AdminOverview {
  organizations: { total: number; disabled: number; new30d: number }
  users: { total: number }
  plans: Array<{ plan: string; label: string; count: number }>
  subscriptions: Array<{ status: SubscriptionStatus; count: number }>
  revenue: { mrrCents: number; atRiskCents: number; received30dCents: number }
  activity30d: { quotes: number; aiDrafts: number }
  openTickets: number
  trialsEnding: Array<{ id: string; name: string; trialEndsAt: string | null }>
  pastDue: Array<{ id: string; name: string; graceEndsAt: string | null }>
  recentPayments: AdminPayment[]
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
  overview: () => http.get<AdminOverview>('/admin/overview'),
  users: (q?: string) => http.get<{ users: AdminUser[] }>('/admin/users', { q }),
  payments: (status?: string) => http.get<{ payments: AdminPayment[] }>('/admin/payments', { status }),
  organization: (orgId: string) => http.get<{ organization: AdminOrganizationDetail }>(`/admin/organizations/${orgId}`),
  updateOrganization: (orgId: string, input: { name?: string; extendTrialDays?: number; disabled?: boolean }) =>
    http.patch<{ organization: AdminOrganizationDetail }>(`/admin/organizations/${orgId}`, input),
  deleteOrganization: (orgId: string, confirmName: string) =>
    http.delete<void>(`/admin/organizations/${orgId}`, { confirmName }),
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
