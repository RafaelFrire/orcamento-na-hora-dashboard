import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Field, Select, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import { errorMessage } from '@/hooks/useApi'
import { formatQuoteNumber } from '@/lib/format'
import { quotesService } from '@/services/quotes'
import type { Quote, QuoteCancelCategory } from '@/types'

import { cancelCategoryLabels } from './labels'

const MIN_REASON = 5

/** Cancela o orçamento exigindo categoria e motivo (ficam no log do orçamento). */
export function CancelQuoteModal({ quote, onClose, onCanceled }: { quote: Quote | null; onClose: () => void; onCanceled: () => void }) {
  return (
    <Modal
      open={!!quote}
      onOpenChange={(o) => !o && onClose()}
      title={quote ? `Cancelar ${formatQuoteNumber(quote.number)}` : ''}
      description="O orçamento continua registrado, mas sai das métricas. Esta ação não pode ser desfeita."
    >
      {quote && <CancelForm key={quote.id} quote={quote} onClose={onClose} onCanceled={onCanceled} />}
    </Modal>
  )
}

function CancelForm({ quote, onClose, onCanceled }: { quote: Quote; onClose: () => void; onCanceled: () => void }) {
  const toast = useToast()
  const [category, setCategory] = useState<QuoteCancelCategory>('WRONG_QUOTE')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length < MIN_REASON) {
      setError(`Explique o motivo do cancelamento (mínimo ${MIN_REASON} caracteres).`)
      return
    }
    setSaving(true)
    try {
      await quotesService.cancel(quote.id, { category, reason: reason.trim() })
      toast(`${formatQuoteNumber(quote.number)} cancelado.`)
      onCanceled()
      onClose()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Categoria" htmlFor="cancel-category">
        <Select id="cancel-category" value={category} onChange={(e) => setCategory(e.target.value as QuoteCancelCategory)}>
          {Object.entries(cancelCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </Field>
      <Field label="Motivo do cancelamento" htmlFor="cancel-reason" error={error ?? undefined}>
        <Textarea
          id="cancel-reason"
          value={reason}
          maxLength={500}
          placeholder="Ex.: cotado para o cliente errado, valores desatualizados…"
          onChange={(e) => { setReason(e.target.value); setError(null) }}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Voltar</Button>
        <Button type="submit" variant="destructive" disabled={saving}>{saving ? 'Cancelando…' : 'Cancelar orçamento'}</Button>
      </div>
    </form>
  )
}
