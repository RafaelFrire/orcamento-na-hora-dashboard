import type { SubscriptionStatus } from '@/services/admin'

export const subscriptionLabel: Record<SubscriptionStatus, string> = {
  PENDING: 'Aguardando pagamento',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Em atraso',
  CANCELING: 'Cancelando',
  EXPIRED: 'Expirada',
}

/** Status do pagamento como vem do Mercado Pago. */
export function paymentStatusLabel(status: string) {
  const map: Record<string, string> = {
    approved: 'Aprovado',
    pending: 'Pendente',
    in_process: 'Em análise',
    rejected: 'Recusado',
    cancelled: 'Cancelado',
    refunded: 'Estornado',
  }
  return map[status] ?? status
}

export const paymentStatusOptions = ['approved', 'pending', 'rejected', 'cancelled', 'refunded']

export const centsToReais = (cents: number) => cents / 100

export function daysUntil(iso: string | null) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}
