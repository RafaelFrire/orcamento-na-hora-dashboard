import { useCallback, useEffect, useMemo, useState } from 'react'

import { presets } from './constants'
import { documentService } from './documentService'
import { initialConfig } from './mocks'
import type {
  Branding,
  ContentSection,
  DocumentConfig,
  DocumentSettings,
  DocumentTemplate,
  StylePreset,
  TemplateCategory,
} from './types'

const uid = () => Math.random().toString(36).slice(2, 9)

export function useDocumentConfig() {
  const [config, setConfig] = useState<DocumentConfig>(initialConfig)
  const [saved, setSaved] = useState<string>(JSON.stringify(initialConfig))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    documentService.load().then((c) => {
      setConfig(c)
      setSaved(JSON.stringify(c))
      setLoading(false)
    })
  }, [])

  const dirty = useMemo(() => JSON.stringify(config) !== saved, [config, saved])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const selected = config.templates.find((t) => t.id === config.selectedId) ?? config.templates[0]

  const patch = useCallback((fn: (c: DocumentConfig) => DocumentConfig) => {
    setJustSaved(false)
    setConfig(fn)
  }, [])

  const updateBranding = useCallback(
    (p: Partial<Branding>) => patch((c) => ({ ...c, branding: { ...c.branding, ...p } })),
    [patch],
  )

  const applyPreset = useCallback(
    (style: StylePreset) => patch((c) => ({ ...c, branding: { ...c.branding, ...presets[style].colors, style } })),
    [patch],
  )

  const updateSettings = useCallback(
    (p: Partial<DocumentSettings>) => patch((c) => ({ ...c, settings: { ...c.settings, ...p } })),
    [patch],
  )

  const select = useCallback((id: string) => patch((c) => ({ ...c, selectedId: id })), [patch])

  const setDefault = useCallback(
    (id: string) =>
      patch((c) => {
        const t = c.templates.find((x) => x.id === id)
        return t ? { ...c, defaults: { ...c.defaults, [t.category]: id } } : c
      }),
    [patch],
  )

  const updateTemplate = useCallback(
    (id: string, p: Partial<DocumentTemplate>) =>
      patch((c) => ({ ...c, templates: c.templates.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
    [patch],
  )

  const updateSections = useCallback(
    (id: string, fn: (s: ContentSection[]) => ContentSection[]) =>
      patch((c) => ({ ...c, templates: c.templates.map((t) => (t.id === id ? { ...t, sections: fn(t.sections) } : t)) })),
    [patch],
  )

  const duplicate = useCallback(
    (id: string) =>
      patch((c) => {
        const t = c.templates.find((x) => x.id === id)
        if (!t) return c
        const copy: DocumentTemplate = {
          ...t,
          id: `tpl-${uid()}`,
          name: `${t.name} (cópia)`,
          builtIn: false,
          sections: t.sections.map((s) => ({ ...s, id: uid() })),
        }
        return { ...c, templates: [...c.templates, copy], selectedId: copy.id }
      }),
    [patch],
  )

  const createCustom = useCallback(
    (category: TemplateCategory = 'contrato') =>
      patch((c) => {
        const t: DocumentTemplate = {
          id: `tpl-${uid()}`,
          name: 'Novo documento',
          description: 'Documento com texto personalizado.',
          category,
          kind: 'custom',
          builtIn: false,
          title: 'Título do documento',
          sections: [{ id: uid(), heading: 'Texto', body: 'Escreva aqui o conteúdo. Use variáveis como {{cliente_nome}}.' }],
        }
        return { ...c, templates: [...c.templates, t], selectedId: t.id }
      }),
    [patch],
  )

  const remove = useCallback(
    (id: string) =>
      patch((c) => {
        const t = c.templates.find((x) => x.id === id)
        if (!t || t.builtIn || c.defaults[t.category] === id) return c
        const templates = c.templates.filter((x) => x.id !== id)
        return { ...c, templates, selectedId: c.selectedId === id ? c.defaults[t.category] : c.selectedId }
      }),
    [patch],
  )

  const save = useCallback(async () => {
    setSaving(true)
    try {
      await documentService.save(config)
      setSaved(JSON.stringify(config))
      setJustSaved(true)
    } finally {
      setSaving(false)
    }
  }, [config])

  const discard = useCallback(() => {
    setConfig(JSON.parse(saved) as DocumentConfig)
    setJustSaved(false)
  }, [saved])

  return {
    config,
    selected,
    loading,
    saving,
    dirty,
    justSaved,
    updateBranding,
    applyPreset,
    updateSettings,
    select,
    setDefault,
    updateTemplate,
    updateSections,
    duplicate,
    createCustom,
    remove,
    save,
    discard,
  }
}

export type DocumentConfigApi = ReturnType<typeof useDocumentConfig>
