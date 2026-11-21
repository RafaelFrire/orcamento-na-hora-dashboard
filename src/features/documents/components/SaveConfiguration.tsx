import { Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface Props {
  dirty: boolean
  saving: boolean
  justSaved: boolean
  onSave: () => void
  onDiscard: () => void
}

export function SaveConfiguration({ dirty, saving, justSaved, onSave, onDiscard }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs">
        {dirty ? (
          <>
            <span className="bg-primary size-2 rounded-full" /> <span className="text-foreground font-medium">Alterações não salvas</span>
          </>
        ) : justSaved ? (
          <span className="text-success flex items-center gap-1 font-medium">
            <Check className="size-3.5" /> Alterações salvas
          </span>
        ) : (
          <span className="text-muted-foreground">Tudo salvo</span>
        )}
      </span>
      <Button variant="ghost" size="sm" disabled={!dirty || saving} onClick={onDiscard}>
        Descartar
      </Button>
      <Button size="sm" disabled={!dirty || saving} onClick={onSave}>
        {saving && <Loader2 className="animate-spin" />} Salvar alterações
      </Button>
    </div>
  )
}
