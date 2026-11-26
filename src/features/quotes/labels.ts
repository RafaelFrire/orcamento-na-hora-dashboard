import type { Quote, QuoteCancelCategory, QuoteOutcome, StatsPeriod } from '@/types'

export const cancelCategoryLabels: Record<QuoteCancelCategory, string> = {
  WRONG_QUOTE: 'Cotação errada',
  DUPLICATE: 'Orçamento duplicado',
  CUSTOMER_REQUEST: 'Cliente desistiu',
  OTHER: 'Outro motivo',
}

export const outcomeLabels: Record<QuoteOutcome, string> = {
  PENDING: 'Em aberto',
  WON: 'Fechado',
  LOST: 'Não fechado',
}

export const periodLabels: Record<StatsPeriod, { tab: string; title: string; hint: string }> = {
  day: { tab: 'Dia', title: 'Hoje', hint: 'hoje, por hora' },
  week: { tab: 'Semana', title: 'Últimos 7 dias', hint: 'últimos 7 dias' },
  month: { tab: 'Mês', title: 'Últimos 30 dias', hint: 'últimos 30 dias' },
  year: { tab: 'Ano', title: 'Últimos 12 meses', hint: 'últimos 12 meses' },
}

/** Rótulo único do estado de um orçamento: cancelado tem prioridade sobre o resultado. */
export function quoteState(q: Pick<Quote, 'status' | 'outcome'>) {
  if (q.status === 'CANCELED') return { key: 'CANCELED' as const, label: 'Cancelado' }
  return { key: q.outcome, label: outcomeLabels[q.outcome] }
}

/** "0.4286" -> "43%"; null -> "—". */
export const formatPercent = (rate: number | null | undefined) =>
  rate === null || rate === undefined ? '—' : `${Math.round(rate * 100)}%`
