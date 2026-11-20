import * as React from 'react'

import { cn } from '@/lib/utils'

export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  )
}
export const THead = (p: React.ComponentProps<'thead'>) => (
  <thead className="text-muted-foreground border-b text-left text-xs uppercase tracking-wide" {...p} />
)
export const TBody = (p: React.ComponentProps<'tbody'>) => <tbody {...p} />
export const TR = ({ className, ...p }: React.ComponentProps<'tr'>) => (
  <tr className={cn('hover:bg-accent/40 border-b last:border-0 transition-colors', className)} {...p} />
)
export const TH = ({ className, ...p }: React.ComponentProps<'th'>) => (
  <th className={cn('px-4 py-3 font-medium', className)} {...p} />
)
export const TD = ({ className, ...p }: React.ComponentProps<'td'>) => (
  <td className={cn('px-4 py-3 align-middle', className)} {...p} />
)
