import { initialConfig } from './mocks'
import type { DocumentConfig } from './types'

/**
 * Persistência mockada (localStorage + latência simulada).
 * Para integrar ao backend, troque o corpo destas funções por chamadas HTTP
 * (ex.: GET/PUT /organizations/:id/document-config) mantendo a assinatura.
 */
const KEY = 'onh:document-config:v1'

export const documentService = {
  async load(): Promise<DocumentConfig> {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return { ...initialConfig, ...(JSON.parse(raw) as DocumentConfig) }
    } catch {
      /* armazenamento indisponível: usa o padrão */
    }
    return initialConfig
  },
  async save(config: DocumentConfig): Promise<void> {
    await new Promise((r) => setTimeout(r, 700))
    localStorage.setItem(KEY, JSON.stringify(config))
  },
}
