import { statusLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { QuoteStatus } from '@/types'

const styles: Record<QuoteStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  draft: 'bg-secondary text-muted-foreground',
}

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles[status])}>
      {statusLabel[status]}
    </span>
  )
}
