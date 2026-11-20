import type { QuoteTemplate } from '@/types'

import { http, orgPath } from './api'

export type QuoteTemplateInput = Omit<QuoteTemplate, 'isDefault'>

export const templateService = {
  get: async () => (await http.get<{ template: QuoteTemplate }>(orgPath('/quote-template'))).template,
  save: async (input: QuoteTemplateInput) =>
    (await http.put<{ template: QuoteTemplate }>(orgPath('/quote-template'), input)).template,
}
