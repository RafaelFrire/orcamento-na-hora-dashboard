import { FileText, LayoutTemplate, Palette, PenLine, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { TableSkeleton } from '@/components/shared/States'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { errorMessage } from '@/hooks/useApi'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api'

import { BrandingSettings } from '@/features/documents/components/BrandingSettings'
import { ContentEditor } from '@/features/documents/components/ContentEditor'
import { DocumentSettings } from '@/features/documents/components/DocumentSettings'
import { PdfPreview } from '@/features/documents/components/PdfPreview'
import { SaveConfiguration } from '@/features/documents/components/SaveConfiguration'
import { TemplateLibrary } from '@/features/documents/components/TemplateLibrary'
import { useDocumentConfig } from '@/features/documents/useDocumentConfig'

const tabs: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'modelos', label: 'Modelos', icon: LayoutTemplate },
  { key: 'identidade', label: 'Identidade visual', icon: Palette },
  { key: 'documento', label: 'Documento', icon: SlidersHorizontal },
  { key: 'conteudo', label: 'Conteúdo', icon: PenLine },
]

export default function DocumentsPage() {
  const api = useDocumentConfig()
  const toast = useToast()
  const { membership } = useAuth()
  const canEdit = membership?.role === 'OWNER' || membership?.role === 'ADMIN'
  const [tab, setTab] = useState('modelos')
  const { config, selected } = api

  async function save() {
    try {
      await api.save()
      toast('Configurações de documentos salvas.')
    } catch (e) {
      const detail = e instanceof ApiError ? e.details?.[0]?.message : undefined
      toast(detail ? `${errorMessage(e)} ${detail}` : errorMessage(e), 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Documentos e PDFs"
        description="Personalize modelos, identidade visual e conteúdo dos seus documentos."
        actions={<SaveConfiguration canEdit={canEdit} dirty={api.dirty} saving={api.saving} justSaved={api.justSaved} onSave={save} onDiscard={api.discard} />}
      />

      {api.loading ? (
        <TableSkeleton rows={5} />
      ) : api.error ? (
        <ErrorNotice message={api.error} onRetry={api.reload} />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="gap-0 overflow-hidden p-0">
            <div role="tablist" aria-label="Seções de personalização" className="flex gap-1 overflow-x-auto border-b px-3 pt-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  id={`tab-${t.key}`}
                  aria-selected={tab === t.key}
                  aria-controls={`panel-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'text-muted-foreground hover:text-foreground flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                    tab === t.key && 'border-primary text-foreground',
                  )}
                >
                  <t.icon className="size-4" /> {t.label}
                </button>
              ))}
            </div>

            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p-6">
              <p className="text-muted-foreground mb-5 flex items-center gap-1.5 text-xs">
                <FileText className="size-3.5" /> Editando: <strong className="text-foreground font-medium">{selected.name}</strong>
              </p>
              {tab === 'modelos' && <TemplateLibrary api={api} />}
              {tab === 'identidade' && <BrandingSettings branding={config.branding} onChange={api.updateBranding} onPreset={api.applyPreset} />}
              {tab === 'documento' && <DocumentSettings settings={config.settings} onChange={api.updateSettings} />}
              {tab === 'conteudo' && (
                <ContentEditor
                  key={selected.id}
                  template={selected}
                  onTemplate={(p) => api.updateTemplate(selected.id, p)}
                  onSections={(fn) => api.updateSections(selected.id, fn)}
                />
              )}
            </div>
          </Card>

          <div className="xl:sticky xl:top-0">
            <PdfPreview template={selected} branding={config.branding} settings={config.settings} />
          </div>
        </div>
      )}
    </>
  )
}
