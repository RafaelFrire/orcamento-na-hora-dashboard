import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Textarea } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import type { DocumentTemplate } from '../types'
import { DynamicVariables } from './DynamicVariables'

interface Props {
  template: DocumentTemplate
  onTemplate: (p: Partial<DocumentTemplate>) => void
  onSections: (fn: (s: DocumentTemplate['sections']) => DocumentTemplate['sections']) => void
}

type Editable = HTMLInputElement | HTMLTextAreaElement

export function ContentEditor({ template, onTemplate, onSections }: Props) {
  // último campo focado — recebe a variável inserida
  const active = useRef<{ el: Editable; apply: (v: string) => void } | null>(null)

  const track = (apply: (v: string) => void) => (e: React.FocusEvent<Editable>) => {
    active.current = { el: e.currentTarget, apply }
  }

  function insert(token: string) {
    const a = active.current
    if (!a) return
    const { el } = a
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const next = el.value.slice(0, start) + token + el.value.slice(end)
    a.apply(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const setSection = (id: string, p: { heading?: string; body?: string }) =>
    onSections((list) => list.map((s) => (s.id === id ? { ...s, ...p } : s)))

  const move = (i: number, d: -1 | 1) =>
    onSections((list) => {
      const j = i + d
      if (j < 0 || j >= list.length) return list
      const copy = [...list]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome do modelo" htmlFor="c-name">
          <Input id="c-name" value={template.name} onChange={(e) => onTemplate({ name: e.target.value })} />
        </Field>
        <Field label="Título do documento" htmlFor="c-title">
          <Input id="c-title" value={template.title} onChange={(e) => onTemplate({ title: e.target.value })} onFocus={track((title) => onTemplate({ title }))} />
        </Field>
      </div>

      <DynamicVariables onInsert={insert} />

      <div className="space-y-3">
        {template.sections.map((s, i) => (
          <div key={s.id} className="bg-card space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Input
                aria-label={`Título da seção ${i + 1}`}
                value={s.heading}
                placeholder="Título da seção"
                className="font-medium"
                onChange={(e) => setSection(s.id, { heading: e.target.value })}
                onFocus={track((heading) => setSection(s.id, { heading }))}
              />
              <Button variant="ghost" size="icon-sm" aria-label="Mover para cima" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Mover para baixo" disabled={i === template.sections.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Remover seção" onClick={() => onSections((l) => l.filter((x) => x.id !== s.id))}>
                <Trash2 />
              </Button>
            </div>
            <Textarea
              aria-label={`Texto da seção ${i + 1}`}
              rows={4}
              value={s.body}
              onChange={(e) => setSection(s.id, { body: e.target.value })}
              onFocus={track((body) => setSection(s.id, { body }))}
            />
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSections((l) => [...l, { id: Math.random().toString(36).slice(2, 9), heading: 'Nova seção', body: '' }])}
        >
          <Plus /> Adicionar seção
        </Button>
      </div>

      {(template.kind === 'quote' || template.kind === 'price-table') && (
        <p className="text-muted-foreground text-xs">
          A tabela de {template.kind === 'quote' ? 'itens e totais' : 'serviços'} é gerada automaticamente a partir dos dados do orçamento; aqui você edita apenas os textos.
        </p>
      )}
    </div>
  )
}
