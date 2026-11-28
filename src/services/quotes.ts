import type { Message, Paginated, Quote, QuoteCancelCategory, QuoteOutcome, QuoteStats, QuoteStatus, StatsPeriod } from '@/types'

import { http, orgPath } from './api'

export interface QuoteInput {
  customerId: string
  notes?: string
  /** Dados só deste orçamento (não alteram o cadastro do cliente). */
  customerDocument?: string
  customerEmail?: string
  serviceAddress?: string
  scheduledFor?: string
  /** Rascunho de IA que originou o orçamento (auditoria). */
  aiDraftId?: string
  items: { catalogItemId: string; quantity: string; unitPrice?: string }[]
}

export const quotesService = {
  list: (
    query: {
      page?: number
      pageSize?: number
      q?: string
      customerId?: string
      from?: string
      to?: string
      status?: QuoteStatus
      outcome?: QuoteOutcome
    } = {},
  ) => http.get<Paginated<Quote>>(orgPath('/quotes'), query),
  /** Série e totais do período, já sem os cancelados nas somas. */
  stats: (period: StatsPeriod) => http.get<QuoteStats>(orgPath('/quotes/stats'), { period }),
  /** Cancela (sem apagar) registrando categoria e motivo. */
  cancel: async (id: string, input: { category: QuoteCancelCategory; reason: string }) =>
    (await http.post<{ quote: Quote }>(orgPath(`/quotes/${id}/cancel`), input)).quote,
  /** Registra se o cliente fechou (WON), não fechou (LOST) ou volta a em aberto (PENDING). */
  setOutcome: async (id: string, outcome: QuoteOutcome) =>
    (await http.patch<{ quote: Quote }>(orgPath(`/quotes/${id}/outcome`), { outcome })).quote,
  get: async (id: string) => (await http.get<{ quote: Quote }>(orgPath(`/quotes/${id}`))).quote,
  create: async (input: QuoteInput) => (await http.post<{ quote: Quote }>(orgPath('/quotes'), input)).quote,
  pdf: (id: string, disposition: 'attachment' | 'inline' = 'attachment') =>
    http.blob(orgPath(`/quotes/${id}/pdf`), { disposition }),
  /** Envia o PDF ao WhatsApp do cliente, direto pelo sistema. */
  sendWhatsapp: (id: string, message?: string) =>
    http.post<{ conversationId: string | null; message: Message }>(orgPath(`/quotes/${id}/send/whatsapp`), message ? { message } : {}),
}
