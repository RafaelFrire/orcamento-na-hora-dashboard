import { Copy, FileSignature, FileText, Receipt, ScrollText, ShieldCheck, Star, Table2, Trash2, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { Branding, DocumentTemplate, TemplateKind } from '../types'

const icons: Record<TemplateKind, LucideIcon> = {
  'price-table': Table2,
  quote: FileText,
  contract: FileSignature,
  terms: ScrollText,
  warranty: ShieldCheck,
  receipt: Receipt,
  custom: FileText,
}

interface Props {
  template: DocumentTemplate
  branding: Branding
  selected: boolean
  isDefault: boolean
  onSelect: () => void
  onSetDefault: () => void
  onDuplicate: () => void
  onDelete: () => void
}

/** Miniatura esquemática do documento, usando as cores da marca. */
function Thumb({ template, branding }: { template: DocumentTemplate; branding: Branding }) {
  const Icon = icons[template.kind]
  const table = template.kind === 'price-table' || template.kind === 'quote'
  return (
    <div className="bg-muted/70 relative flex h-28 items-center justify-center rounded-lg">
      <div className="h-[92px] w-[66px] overflow-hidden rounded-[3px] bg-white shadow-sm ring-1 ring-black/10">
        <div className="h-3.5" style={{ background: branding.primary }}>
          <div className="mt-1.5 ml-1.5 h-1 w-6 rounded-full" style={{ background: branding.accent }} />
        </div>
        <div className="space-y-1 p-1.5">
          <div className="h-1 w-8 rounded-full bg-neutral-300" />
          {table ? (
            <>
              <div className="mt-1.5 h-1.5 rounded-[1px]" style={{ background: `${branding.primary}22` }} />
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-px bg-neutral-200" />
              ))}
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-1 rounded-full bg-neutral-100" />
              ))}
              <div className="ml-auto h-1.5 w-6 rounded-[1px]" style={{ background: branding.accent }} />
            </>
          ) : (
            [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className={cn('h-1 rounded-full bg-neutral-200', i % 3 === 2 && 'w-3/4')} />)
          )}
        </div>
      </div>
      <Icon className="text-muted-foreground/60 absolute top-2 right-2 size-4" />
    </div>
  )
}

export function TemplateCard({ template, branding, selected, isDefault, onSelect, onSetDefault, onDuplicate, onDelete }: Props) {
  return (
    <div
      className={cn(
        'bg-card group flex flex-col gap-3 rounded-xl border p-3 transition-shadow hover:shadow-md',
        selected && 'border-primary ring-primary/30 ring-2',
      )}
    >
      <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={`Selecionar ${template.name}`} className="text-left outline-none">
        <Thumb template={template} branding={branding} />
      </button>
      <div className="min-w-0 flex-1 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm leading-tight font-semibold">{template.name}</h3>
          {isDefault && (
            <Badge variant="outline" className="border-primary/50 text-primary shrink-0 gap-1">
              <Star className="size-3 fill-current" /> Padrão
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{template.description}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant={selected ? 'default' : 'outline'} className="flex-1" onClick={onSelect}>
          {selected ? 'Em edição' : 'Selecionar'}
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Definir como padrão" title="Definir como padrão da categoria" disabled={isDefault} onClick={onSetDefault}>
          <Star />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Duplicar modelo" title="Duplicar" onClick={onDuplicate}>
          <Copy />
        </Button>
        {!template.builtIn && (
          <Button size="icon-sm" variant="ghost" aria-label="Excluir modelo" title="Excluir" disabled={isDefault} onClick={onDelete}>
            <Trash2 />
          </Button>
        )}
      </div>
    </div>
  )
}
