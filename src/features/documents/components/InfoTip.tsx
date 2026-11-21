import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function InfoTip({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label="Mais informações" className="text-muted-foreground hover:text-foreground inline-flex align-middle">
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-60" sideOffset={6}>
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** Grupo de campos com título, usado para organizar os painéis. */
export function Group({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
        {title}
        {hint && <InfoTip>{hint}</InfoTip>}
      </legend>
      {children}
    </fieldset>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-sm">
        {label}
        {hint && <InfoTip>{hint}</InfoTip>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`focus-visible:ring-ring/50 relative h-5 w-9 shrink-0 rounded-full outline-none transition-colors focus-visible:ring-[3px] ${checked ? 'bg-primary' : 'bg-input'}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  )
}
