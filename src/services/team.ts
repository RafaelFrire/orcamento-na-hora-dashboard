import type { MemberRole } from '@/types'

import { http, orgPath } from './api'
import type { AuthSession } from './auth'

export type TicketType = 'REMOVE_MEMBER' | 'REACTIVATE_MEMBER' | 'OTHER'

export interface TeamMember {
  userId: string
  name: string
  email: string
  role: MemberRole
  status: 'ACTIVE' | 'DISABLED'
  lastAccessAt: string | null
  /** Há chamado de remoção aberto: o acesso continua até o admin atender. */
  removalRequested: boolean
}

export interface TeamInvitation {
  id: string
  name: string
  email: string
  role: MemberRole
  expiresAt: string
}

export interface TeamTicket {
  id: string
  type: TicketType
  targetUserId: string | null
  message: string | null
  urgent: boolean
  status: 'OPEN' | 'RESOLVED'
  resolutionNote: string | null
  createdAt: string
}

export interface TeamAuditEntry {
  id: string
  action: string
  detail: string | null
  actorName: string | null
  targetName: string | null
  createdAt: string
}

export interface TeamData {
  members: TeamMember[]
  invitations: TeamInvitation[]
  tickets: TeamTicket[]
  /** used = ativos + convites pendentes (vagas reservadas). */
  seats: { used: number; active: number; pending: number; limit: number }
  plan: { key: string; label: string; expired: boolean }
  audit: TeamAuditEntry[]
}

/** O token só aparece na criação/reenvio; guarde para montar o link. */
export interface InviteResult {
  invitation: TeamInvitation
  token: string
}

export const inviteLink = (token: string) => `${window.location.origin}/convite/${token}`

export const teamService = {
  get: () => http.get<TeamData>(orgPath('/team')),
  invite: (input: { name: string; email: string }) => http.post<InviteResult>(orgPath('/invitations'), input),
  regenerate: (id: string) => http.post<InviteResult>(orgPath(`/invitations/${id}/regenerate`)),
  revoke: (id: string) => http.delete<void>(orgPath(`/invitations/${id}`)),
  openTicket: (input: { type: TicketType; targetUserId?: string; message?: string }) =>
    http.post<{ ticket: TeamTicket }>(orgPath('/tickets'), input),
}

export interface InvitationInfo {
  type: 'INVITE' | 'RESET'
  organizationName: string
  email: string
  name: string
  hasAccount: boolean
}

export const invitationService = {
  get: (token: string) => http.get<{ invitation: InvitationInfo }>(`/invitations/${encodeURIComponent(token)}`),
  accept: (token: string, input: { name?: string; password: string }) =>
    http.post<AuthSession & { token: string }>(`/invitations/${encodeURIComponent(token)}/accept`, input, false),
}
