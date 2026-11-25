import type { AiQuoteDraft } from '@/types'

import { http, orgPath } from './api'

export const aiService = {
  /** Gera um rascunho de orçamento a partir do pedido do cliente. Nada é salvo no orçamento. */
  /** Com `conversationId` a API analisa a conversa inteira (cliente e empresa); `text` vira observação extra. */
  draft: (input: { text?: string; conversationId?: string; customerId?: string; source?: 'MANUAL' | 'WHATSAPP' }) =>
    http.post<{ draft: AiQuoteDraft; usage: { aiRequestId: string } }>(orgPath('/quotes/ai-draft'), input),
  discard: (id: string) => http.post<void>(orgPath(`/quotes/ai-draft/${id}/discard`)),
}
