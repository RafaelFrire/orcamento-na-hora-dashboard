import { CheckCircle2, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type ToastKind = 'success' | 'error'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {})

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random()
    setItems((s) => [...s, { id, kind, message }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed right-6 bottom-6 z-[60] flex flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'bg-card flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg',
              t.kind === 'success' ? 'border-success/40' : 'border-destructive/40',
            )}
          >
            {t.kind === 'success' ? (
              <CheckCircle2 className="text-success size-4" />
            ) : (
              <XCircle className="text-destructive size-4" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
