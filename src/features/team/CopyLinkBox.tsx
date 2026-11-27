import { Check, Copy, MessageCircle } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inviteLink } from '@/services/team'

interface Props {
  token: string
  /** Nome de quem vai receber o link (usado na mensagem pronta do WhatsApp). */
  name?: string
  /** Texto do WhatsApp; por padrão, mensagem de convite. */
  message?: string
}

/** Mostra o link de uso único com botões de copiar e enviar pelo WhatsApp. */
export function CopyLinkBox({ token, name, message }: Props) {
  const link = inviteLink(token)
  const [copied, setCopied] = useState(false)
  const text = message ?? `Olá${name ? `, ${name}` : ''}! Segue seu link de acesso ao Orçamento na Hora: ${link}\nO link é pessoal e vale por 72 horas.`

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* sem permissão de área de transferência: o campo continua selecionável */
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input readOnly aria-label="Link de acesso" value={link} onFocus={(e) => e.target.select()} />
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copiado' : 'Copiar link'}
        </Button>
      </div>
      <Button asChild variant="outline" size="sm">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          <MessageCircle className="size-4" /> Enviar pelo WhatsApp
        </a>
      </Button>
      <p className="text-muted-foreground text-xs">
        Este link aparece só agora e vale uma única vez. Se perder, gere outro na lista de convites pendentes.
      </p>
    </div>
  )
}
