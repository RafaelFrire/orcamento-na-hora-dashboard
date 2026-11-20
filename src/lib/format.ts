import type { Quote, QuoteStatus } from '@/types'

export const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const statusLabel: Record<QuoteStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  draft: 'Rascunho',
}

export const quoteSubtotal = (q: Pick<Quote, 'items'>) =>
  q.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

export const quoteTotal = (q: Pick<Quote, 'items' | 'discount'>) =>
  Math.max(0, quoteSubtotal(q) - q.discount)
