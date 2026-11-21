import { ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const MAX = 2 * 1024 * 1024
const TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  current: string | null
  onConfirm: (dataUrl: string | null) => void
}

export function LogoUploadModal({ open, onOpenChange, current, onConfirm }: Props) {
  const [draft, setDraft] = useState<string | null>(current)
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  function read(file?: File) {
    if (!file) return
    if (!TYPES.includes(file.type)) return setError('Use uma imagem PNG, JPG, SVG ou WebP.')
    if (file.size > MAX) return setError('A imagem deve ter no máximo 2 MB.')
    setError('')
    const fr = new FileReader()
    fr.onload = () => setDraft(String(fr.result))
    fr.readAsDataURL(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    read(e.dataTransfer.files[0])
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setDraft(current)
          setError('')
        }
        onOpenChange(o)
      }}
      title="Logo da empresa"
      description="Aparece no cabeçalho dos documentos. PNG com fundo transparente funciona melhor."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm(draft)
              onOpenChange(false)
            }}
          >
            Usar logo
          </Button>
        </>
      }
    >
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn('flex h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors', over && 'border-primary bg-accent')}
      >
        {draft ? (
          <img src={draft} alt="Prévia da logo" className="max-h-28 max-w-[80%] object-contain" />
        ) : (
          <>
            <ImagePlus className="text-muted-foreground size-7" />
            <p className="text-sm">Arraste a imagem aqui</p>
          </>
        )}
      </div>
      <input ref={input} type="file" accept={TYPES.join(',')} hidden aria-label="Arquivo da logo" onChange={(e) => read(e.target.files?.[0])} />
      {error && (
        <p role="alert" className="text-destructive mt-2 text-xs">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
          Escolher arquivo
        </Button>
        {draft && (
          <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
            <Trash2 /> Remover
          </Button>
        )}
      </div>
    </Modal>
  )
}
