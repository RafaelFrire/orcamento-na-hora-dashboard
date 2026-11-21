import { Download, ExternalLink, Eye, EyeOff, FileText } from 'lucide-react'
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
  const isPdf = message.mediaMime === 'application/pdf'
  const [previewing, setPreviewing] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

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

  // PDFs só são carregados quando o usuário pede a prévia.
  useEffect(() => {
    if (!isPdf || !previewing) return
    let revoked = false
    let created: string | null = null
    whatsappService
      .media(conversationId, message.id)
      .then((blob) => {
        if (revoked) return
        created = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
        setPdfUrl(created)
      })
      .catch(() => !revoked && setFailed(true))
    return () => {
      revoked = true
      if (created) URL.revokeObjectURL(created)
      setPdfUrl(null)
    }
  }, [conversationId, message.id, isPdf, previewing])

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

  if (isPdf) {
    return (
      <div className="bg-background/60 mb-1 w-full min-w-60 rounded-lg border text-xs">
        <div className="flex items-center gap-2 px-3 py-2">
          <FileText className="size-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium">{message.mediaName ?? 'Documento.pdf'}</span>
          <button type="button" onClick={() => setPreviewing((v) => !v)} aria-label={previewing ? 'Ocultar prévia' : 'Visualizar PDF'} className="hover:bg-muted rounded p-1">
            {previewing ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <button type="button" onClick={download} disabled={busy} aria-label={`Baixar ${message.mediaName ?? 'arquivo'}`} className="hover:bg-muted rounded p-1">
            <Download className="size-4" />
          </button>
        </div>
        {previewing && (
          <div className="border-t">
            {pdfUrl ? (
              <>
                <iframe title={`Prévia de ${message.mediaName ?? 'PDF'}`} src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} className="h-80 w-full" />
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground flex items-center justify-end gap-1 px-3 py-1.5">
                  Abrir em tela cheia <ExternalLink className="size-3" />
                </a>
              </>
            ) : (
              <span className="bg-muted block h-32 animate-pulse" aria-label="Carregando prévia" />
            )}
          </div>
        )}
      </div>
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
