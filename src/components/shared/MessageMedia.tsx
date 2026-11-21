import { Download, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

import { downloadBlob } from '@/services/files'
import { whatsappService } from '@/services/whatsapp'
import type { Message } from '@/types'

/** Anexo de uma mensagem: imagens aparecem na hora; os demais tipos viram um botão de download. */
export function MessageMedia({ conversationId, message }: { conversationId: string; message: Message }) {
  const isImage = message.type === 'image' || message.type === 'sticker'
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isImage) return
    let revoked = false
    let created: string | null = null
    whatsappService
      .media(conversationId, message.id)
      .then((blob) => {
        if (revoked) return
        created = URL.createObjectURL(blob)
        setUrl(created)
      })
      .catch(() => !revoked && setFailed(true))
    return () => {
      revoked = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [conversationId, message.id, isImage])

  async function download() {
    setBusy(true)
    try {
      downloadBlob(await whatsappService.media(conversationId, message.id), message.mediaName ?? 'arquivo')
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  if (failed) return <span className="text-destructive block text-xs">Não foi possível carregar o anexo.</span>

  if (isImage) {
    return url ? (
      <a href={url} target="_blank" rel="noreferrer" className="mb-1 block">
        <img src={url} alt={message.body || 'Imagem enviada'} className="max-h-64 rounded-lg object-cover" />
      </a>
    ) : (
      <span className="bg-muted mb-1 block h-32 w-48 animate-pulse rounded-lg" aria-label="Carregando imagem" />
    )
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      aria-label={`Baixar ${message.mediaName ?? 'arquivo'}`}
      className="bg-background/60 hover:bg-background mb-1 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs"
    >
      <FileText className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate font-medium">{message.mediaName ?? 'Arquivo'}</span>
      <Download className="size-4 shrink-0" />
    </button>
  )
}
