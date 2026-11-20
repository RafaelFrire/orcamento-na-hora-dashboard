import { FileText } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Logo({ className, dark = true }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 font-semibold', className)}>
      <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
        <FileText className="size-4.5" />
      </span>
      <span className={cn('leading-tight', dark ? 'text-white' : 'text-foreground')}>
        Orçamento <span className="text-primary">na Hora</span>
      </span>
    </div>
  )
}
