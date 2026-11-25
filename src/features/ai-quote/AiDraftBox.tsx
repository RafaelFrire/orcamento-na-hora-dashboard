import { Loader2, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/form'
import { errorMessage } from '@/hooks/useApi'
import { aiService } from '@/services/ai'
import type { AiQuoteDraft } from '@/types'

import { getCachedDraft, setCachedDraft, signatureOf } from './aiStorage'

export interface AiDraftMeta {
  aiDraftId: string
  signature: string
  fromCache: boolean
  text: string
}

/**
 * "Preencher com IA". Em uma conversa do WhatsApp a IA lê a conversa inteira
 * (cliente e empresa) sozinha; sem conversa, o dono cola o pedido. A IA nunca
 * define preço e nada é salvo antes de "Gerar orçamento".
 */
export function AiDraftBox({
  conversation,
  initialText = '',
  customerId,
  autoRun = false,
  onDraft,
}: {
  /** Conversa a analisar por inteiro. `key` muda quando chega mensagem nova. */
  conversation?: { id: string; label: string; key: string }
  initialText?: string
  customerId?: string
  /** Gera sozinho ao abrir (usa o cache local se já houver resultado). */
  autoRun?: boolean
  onDraft: (draft: AiQuoteDraft, meta: AiDraftMeta) => void | Promise<void>
}) {
  const [text, setText] = useState(initialText)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [lastSignature, setLastSignature] = useState('')
  const started = useRef(false)

  const signature = signatureOf({ conversationId: conversation?.id, conversationKey: conversation?.key, text })
  // Só "gera novamente" (e cobra de novo) quando a entrada é idêntica à última; entrada nova tenta o cache antes.
  const again = lastSignature === signature

  async function generate() {
    if (!conversation && !text.trim()) return setError('Cole ou digite o pedido do cliente.')
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const cached = again ? null : getCachedDraft(signature)
      if (cached) {
        await onDraft(cached.draft, { aiDraftId: cached.aiDraftId, signature, fromCache: true, text })
        setNotice('Resultado recuperado do seu navegador, sem novo custo de IA.')
      } else {
        const res = await aiService.draft({
          ...(conversation ? { conversationId: conversation.id } : {}),
          ...(text.trim() ? { text: text.trim() } : {}),
          ...(customerId ? { customerId } : {}),
          source: conversation ? 'WHATSAPP' : 'MANUAL',
        })
        setCachedDraft(signature, res.draft, res.usage.aiRequestId)
        await onDraft(res.draft, { aiDraftId: res.usage.aiRequestId, signature, fromCache: false, text })
      }
      setLastSignature(signature)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  // Ao chegar de uma conversa, a IA já começa a analisar (uma única vez).
  useEffect(() => {
    if (!autoRun || started.current) return
    started.current = true
    void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun])

  return (
    <Card className="border-primary/40 gap-3 p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Sparkles className="text-primary size-4" /> Preencher com IA
      </h2>
      {conversation ? (
        <p className="text-muted-foreground text-sm">
          A IA lê a conversa inteira com <strong className="text-foreground">{conversation.label}</strong> (suas respostas também) e monta o rascunho com itens do seu catálogo. Os preços são sempre os do catálogo.
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          Cole o pedido do cliente. A IA monta o rascunho com itens do seu catálogo — os preços são sempre os do catálogo — e você confere antes de gerar.
        </p>
      )}
      <Textarea
        aria-label={conversation ? 'Observação extra para a IA' : 'Pedido do cliente'}
        maxLength={4000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          conversation
            ? 'Opcional: algo que não está na conversa (ex.: "o cliente combinou por telefone 6 horas").'
            : 'Ex.: Oi, sou a Marina. Preciso de 3 horas de consultoria técnica e manutenção mensal, entrega até dia 10.'
        }
      />
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      {notice && <p role="status" className="text-muted-foreground text-sm">{notice}</p>}
      <div className="flex items-center gap-3">
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}{' '}
          {loading ? (conversation ? 'Analisando conversa...' : 'Gerando rascunho...') : again ? 'Gerar novamente' : conversation ? 'Analisar conversa' : 'Gerar rascunho'}
        </Button>
        {again && !loading && <span className="text-muted-foreground text-xs">Gerar novamente conta como um novo rascunho do plano.</span>}
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
