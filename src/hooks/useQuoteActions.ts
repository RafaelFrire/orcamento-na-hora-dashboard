import { useToast } from '@/components/ui/toast'
import { errorMessage } from '@/hooks/useApi'
import { formatQuoteNumber } from '@/lib/format'
import { downloadBlob } from '@/services/files'
import { quotesService } from '@/services/quotes'

/** Ações sobre o PDF de um orçamento já criado. */
export function useQuoteActions() {
  const toast = useToast()

  // A aba é aberta de forma síncrona (no clique) para não ser barrada pelo bloqueador de pop-ups.
  const openTab = () => window.open('', '_blank')

  return {
    async download(q: { id: string; number: number }) {
      try {
        const blob = await quotesService.pdf(q.id, 'attachment')
        downloadBlob(blob, `${formatQuoteNumber(q.number)}.pdf`)
        toast(`PDF de ${formatQuoteNumber(q.number)} baixado.`)
      } catch (e) {
        toast(errorMessage(e))
      }
    },
    async viewPdf(q: { id: string }) {
      const tab = openTab()
      try {
        const blob = await quotesService.pdf(q.id, 'inline')
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
        if (tab) tab.location.href = url
        else window.location.href = url
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } catch (e) {
        tab?.close()
        toast(errorMessage(e))
      }
    },
  }
}
