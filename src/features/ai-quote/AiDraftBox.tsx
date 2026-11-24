import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/form'
import { errorMessage } from '@/hooks/useApi'
import { aiService } from '@/services/ai'
import type { AiQuoteDraft } from '@/types'

/**
 * "Preencher com IA": o dono cola o pedido do cliente e recebe um rascunho para
 * conferir. A IA nunca define preço e nada é salvo antes de "Gerar orçamento".
 */
export function AiDraftBox({
  initialText = '',
  customerId,
  source = 'MANUAL',
  onDraft,
}: {
  initialText?: string
  customerId?: string
  source?: 'MANUAL' | 'WHATSAPP'
  onDraft: (draft: AiQuoteDraft, aiDraftId: string) => void | Promise<void>
}) {
  const [text, setText] = useState(initialText)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!text.trim()) return setError('Cole ou digite o pedido do cliente.')
    setError('')
    setLoading(true)
    try {
      const res = await aiService.draft({ text: text.trim(), ...(customerId ? { customerId } : {}), source })
      await onDraft(res.draft, res.usage.aiRequestId)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-primary/40 gap-3 p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Sparkles className="text-primary size-4" /> Preencher com IA
      </h2>
      <p className="text-muted-foreground text-sm">
        Cole o pedido do cliente. A IA monta o rascunho com itens do seu catálogo — os preços são sempre os do catálogo — e você confere antes de gerar.
      </p>
      <Textarea
        aria-label="Pedido do cliente"
        maxLength={4000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ex.: Oi, sou a Marina. Preciso de 3 horas de consultoria técnica e manutenção mensal, entrega até dia 10."
      />
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <div>
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} {loading ? 'Gerando rascunho...' : 'Gerar rascunho'}
        </Button>
      </div>
    </Card>
  )
}

/** Selo exibido em campos preenchidos pela IA e ainda não conferidos. */
export function AiBadge({ label = 'Sugerido pela IA' }: { label?: string }) {
  return (
    <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
      <Sparkles className="size-3" /> {label}
    </span>
  )
}
