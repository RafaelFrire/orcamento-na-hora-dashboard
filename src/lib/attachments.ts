const MB = 1024 * 1024

/** Mesmos tipos e limites que a API aceita para o WhatsApp Cloud. */
const RULES: { label: string; max: number; mimes: string[] }[] = [
  { label: 'imagem', max: 5 * MB, mimes: ['image/jpeg', 'image/png'] },
  { label: 'vídeo', max: 16 * MB, mimes: ['video/mp4', 'video/3gpp'] },
  { label: 'áudio', max: 16 * MB, mimes: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg'] },
  {
    label: 'documento',
    max: 20 * MB,
    mimes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ],
  },
]

export const ATTACHMENT_ACCEPT = RULES.flatMap((r) => r.mimes).join(',')

/** Devolve a mensagem de erro, ou '' quando o arquivo pode ser enviado. */
export function validateAttachment(file: { type: string; size: number }): string {
  const rule = RULES.find((r) => r.mimes.includes(file.type))
  if (!rule) return 'Tipo de arquivo não suportado pelo WhatsApp. Envie imagem (JPG/PNG), vídeo MP4, áudio, PDF, Word, Excel, PowerPoint ou TXT.'
  if (file.size === 0) return 'O arquivo está vazio.'
  if (file.size > rule.max) return `O limite para ${rule.label} é de ${rule.max / MB} MB.`
  return ''
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / MB).toFixed(1).replace('.', ',')} MB`
}
