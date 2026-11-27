import type { MemberRole } from '@/types'

export const roleLabel: Record<MemberRole, string> = { OWNER: 'Proprietário', ADMIN: 'Administrador', MEMBER: 'Funcionário' }

export const ticketLabel = {
  REMOVE_MEMBER: 'Remover acesso',
  REACTIVATE_MEMBER: 'Reativar acesso',
  OTHER: 'Outro pedido',
} as const

export function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function hoursLeft(iso: string) {
  const h = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000))
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h`
}
