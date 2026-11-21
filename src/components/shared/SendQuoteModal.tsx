import { Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import { errorMessage } from '@/hooks/useApi'
import { formatQuoteNumber } from '@/lib/format'
import { quotesService } from '@/services/quotes'
import type { Quote } from '@/types'

interface Props {
  quote: Pick<Quote, 'id' | 'number' | 'customer'> | null
  onClose: () => void
}

/** Envia o PDF do orçamento ao WhatsApp do cliente, sem sair do sistema. */
export function SendQuoteModal({ quote, onClose }: Props) {
  const toast = useToast()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState<string | null | undefined>(undefined)

  const quoteId = quote?.id
  useEffect(() => {
    if (quoteId) {
      setMessage('')
      setError('')
      setSentTo(undefined)
    }
  }, [quoteId])

  async function send() {
    if (!quote || sending) return
    setSending(true)
    setError('')
    try {
      const res = await quotesService.sendWhatsapp(quote.id, message.trim() || undefined)
      setSentTo(res.conversationId)
      toast(`Orçamento ${formatQuoteNumber(quote.number)} enviado pelo WhatsApp.`)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSending(false)
    }
  }

  const sent = sentTo !== undefined
  const phone = quote?.customer.phone

  return (
    <Modal
      open={!!quote}
      onOpenChange={(o) => !o && onClose()}
      title={quote ? `Enviar ${formatQuoteNumber(quote.number)}` : ''}
      description={quote ? `${quote.customer.name}${phone ? ` · ${phone}` : ''}` : ''}
      footer={
        sent ? (
          <>
            {sentTo && <Button variant="outline" asChild><Link to="/conversas">Abrir conversas</Link></Button>}
            <Button onClick={onClose}>Fechar</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={sending}>Cancelar</Button>
            <Button onClick={send} disabled={sending || !phone}><Send /> {sending ? 'Enviando…' : 'Enviar PDF'}</Button>
          </>
        )
      }
    >
      {sent ? (
        <p className="text-sm">O PDF foi enviado ao cliente e a mensagem já aparece na conversa dele.</p>
      ) : (
        <div className="space-y-3">
          {!phone && (
            <p role="alert" className="text-destructive text-sm">
              Este cliente não tem telefone cadastrado. Cadastre um número com DDD para enviar.
            </p>
          )}
          <label className="block space-y-1.5 text-sm font-medium">
            Mensagem (opcional)
            <Textarea
              rows={4}
              maxLength={1024}
              value={message}
              placeholder="Se deixar em branco, enviamos uma mensagem padrão com o número, o valor e a validade."
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <p className="text-muted-foreground text-xs">
            O WhatsApp só permite enviar se o cliente tiver escrito para você nas últimas 24 horas.
          </p>
          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
