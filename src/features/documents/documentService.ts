import { http, orgPath } from '@/services/api'

import type { DocumentConfig } from './types'

/** Formato trocado com a API (`/organizations/:id/document-config`). */
type ApiConfig = Omit<DocumentConfig, 'selectedId'> & { isDefault?: boolean }

function fromApi(c: ApiConfig, selectedId?: string): DocumentConfig {
  const { branding, settings, templates, defaults } = c
  const keep = selectedId && templates.some((t) => t.id === selectedId)
  return { branding, settings, templates, defaults, selectedId: keep ? selectedId : defaults.orcamento }
}

export const documentService = {
  async load(): Promise<DocumentConfig> {
    const { config } = await http.get<{ config: ApiConfig }>(orgPath('/document-config'))
    return fromApi(config)
  },

  /** Salva o estado completo e devolve a versão normalizada pelo servidor. */
  async save(config: DocumentConfig): Promise<DocumentConfig> {
    const { branding, settings, templates, defaults } = config
    const { config: saved } = await http.put<{ config: ApiConfig }>(orgPath('/document-config'), {
      branding,
      settings,
      defaults,
      // `builtIn` é derivado no servidor
      templates: templates.map((t) => ({ id: t.id, name: t.name, description: t.description, category: t.category, kind: t.kind, title: t.title, sections: t.sections })),
    })
    return fromApi(saved, config.selectedId)
  },
}
