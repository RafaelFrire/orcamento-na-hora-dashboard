import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import { categories } from '../constants'
import type { DocumentConfigApi } from '../useDocumentConfig'
import type { TemplateCategory } from '../types'
import { TemplateCard } from './TemplateCard'

export function TemplateLibrary({ api }: { api: DocumentConfigApi }) {
  const { config, select, setDefault, duplicate, remove, createCustom } = api
  const [filter, setFilter] = useState<TemplateCategory | 'all'>('all')
  const [toDelete, setToDelete] = useState<string | null>(null)

  const visible = categories.filter((c) => filter === 'all' || c.key === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filtrar por categoria" className="flex flex-wrap gap-1.5">
          {[{ key: 'all' as const, label: 'Todos' }, ...categories.map((c) => ({ key: c.key, label: c.label }))].map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={filter === c.key}
              onClick={() => setFilter(c.key)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filter === c.key ? 'bg-foreground text-background border-foreground' : 'hover:bg-accent text-muted-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => createCustom(filter === 'all' ? 'contrato' : filter)}>
          <Plus /> Novo documento
        </Button>
      </div>

      {visible.map((cat) => {
        const list = config.templates.filter((t) => t.category === cat.key)
        return (
          <section key={cat.key} aria-label={cat.label}>
            <div className="mb-3">
              <h3 className="text-sm font-semibold">{cat.label}</h3>
              <p className="text-muted-foreground text-xs">{cat.description}</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {list.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  branding={config.branding}
                  selected={config.selectedId === t.id}
                  isDefault={config.defaults[t.category] === t.id}
                  onSelect={() => select(t.id)}
                  onSetDefault={() => setDefault(t.id)}
                  onDuplicate={() => duplicate(t.id)}
                  onDelete={() => setToDelete(t.id)}
                />
              ))}
            </div>
          </section>
        )
      })}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir modelo?"
        description="O modelo será removido ao salvar as alterações."
        onConfirm={() => toDelete && remove(toDelete)}
      />
    </div>
  )
}
