import type { AiQuoteDraft } from '@/types'

import { http, orgPath } from './api'

export const aiService = {
  /** Gera um rascunho de orçamento a partir do pedido do cliente. Nada é salvo no orçamento. */
  draft: (input: { text: string; customerId?: string; source?: 'MANUAL' | 'WHATSAPP' }) =>
    http.post<{ draft: AiQuoteDraft; usage: { aiRequestId: string } }>(orgPath('/quotes/ai-draft'), input),
  discard: (id: string) => http.post<void>(orgPath(`/quotes/ai-draft/${id}/discard`)),
}
