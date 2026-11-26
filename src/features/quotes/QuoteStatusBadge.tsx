import { Ban, CheckCircle2, CircleDashed, XCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Quote } from '@/types'

import { quoteState } from './labels'

const styles = {
  CANCELED: { icon: Ban, className: 'bg-destructive/10 text-destructive' },
  WON: { icon: CheckCircle2, className: 'bg-success/15 text-success' },
  LOST: { icon: XCircle, className: 'bg-secondary text-muted-foreground' },
  PENDING: { icon: CircleDashed, className: 'bg-accent text-accent-foreground' },
} as const

export function QuoteStatusBadge({ quote }: { quote: Pick<Quote, 'status' | 'outcome'> }) {
  const { key, label } = quoteState(quote)
  const { icon: Icon, className } = styles[key]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', className)}>
      <Icon className="size-3" aria-hidden /> {label}
    </span>
  )
}
