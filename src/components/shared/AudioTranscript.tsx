import { AudioLines, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { errorMessage } from '@/hooks/useApi'
import { whatsappService } from '@/services/whatsapp'
import type { Message } from '@/types'

/**
 * Transcrição de um áudio recebido. A API transcreve sozinha ao chegar; enquanto o
 * texto não aparece (a lista é atualizada a cada poucos segundos) o botão permite
 * pedir a transcrição de novo, por exemplo se o provedor falhou.
 */
export function AudioTranscript({
  conversationId,
  message,
  onTranscribed,
}: {
  conversationId: string
  message: Message
  onTranscribed?: (message: Message) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [local, setLocal] = useState<string | null>(null)
  const transcript = message.transcript ?? local

  async function transcribe() {
    setBusy(true)
    setError('')
    try {
      const updated = await whatsappService.transcribe(conversationId, message.id)
      setLocal(updated.transcript ?? '')
      onTranscribed?.(updated)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (transcript) {
    return (
      <div className="bg-background/60 mb-1 rounded-lg border px-3 py-2 text-xs">
        <span className="text-muted-foreground mb-0.5 flex items-center gap-1 font-medium">
          <AudioLines className="size-3.5" /> Transcrição
        </span>
        <span className="block break-words whitespace-pre-wrap">{transcript}</span>
      </div>
    )
  }

  // Só áudios recebidos são transcritos automaticamente; os enviados pela empresa não.
  if (message.direction !== 'IN') return null

  return (
    <div className="mb-1 text-xs">
      <button
        type="button"
        onClick={transcribe}
        disabled={busy}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 underline-offset-2 hover:underline disabled:opacity-60"
      >
        <RefreshCw className={busy ? 'size-3.5 animate-spin' : 'size-3.5'} />
        {busy ? 'Transcrevendo…' : local === '' ? 'Sem fala reconhecida. Tentar de novo' : 'Transcrever áudio'}
      </button>
      {error && <span role="alert" className="text-destructive block">{error}</span>}
    </div>
  )
}
