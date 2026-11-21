import type { Message, Paginated, Quote } from '@/types'

import { http, orgPath } from './api'

export interface QuoteInput {
  customerId: string
  notes?: string
  items: { catalogItemId: string; quantity: string; unitPrice?: string }[]
}

export const quotesService = {
  list: (query: { page?: number; pageSize?: number; q?: string; customerId?: string; from?: string; to?: string } = {}) =>
    http.get<Paginated<Quote>>(orgPath('/quotes'), query),
  get: async (id: string) => (await http.get<{ quote: Quote }>(orgPath(`/quotes/${id}`))).quote,
  create: async (input: QuoteInput) => (await http.post<{ quote: Quote }>(orgPath('/quotes'), input)).quote,
  pdf: (id: string, disposition: 'attachment' | 'inline' = 'attachment') =>
    http.blob(orgPath(`/quotes/${id}/pdf`), { disposition }),
  /** Envia o PDF ao WhatsApp do cliente, direto pelo sistema. */
  sendWhatsapp: (id: string, message?: string) =>
    http.post<{ conversationId: string | null; message: Message }>(orgPath(`/quotes/${id}/send/whatsapp`), message ? { message } : {}),
}
