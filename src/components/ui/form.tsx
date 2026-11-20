import * as React from 'react'

import { cn } from '@/lib/utils'

const field =
  'border-input bg-card placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 w-full rounded-md border px-3 text-sm outline-none transition-shadow focus-visible:ring-[3px] disabled:opacity-50'

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={cn('mb-1.5 block text-sm font-medium', className)} {...props} />
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(field, 'min-h-20 py-2', className)} {...props} />
}

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(field, 'h-9 pr-8', className)} {...props} />
}

export function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-destructive mt-1 text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
