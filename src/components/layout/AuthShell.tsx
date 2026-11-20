import { CheckCircle2, FileText } from 'lucide-react'
import type { ReactNode } from 'react'

import { Logo } from '@/components/shared/Logo'
import { ToastProvider } from '@/components/ui/toast'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="grid min-h-screen min-w-[1100px] grid-cols-2">
        <section className="bg-sidebar relative flex flex-col justify-between overflow-hidden p-14 text-white">
          <div className="bg-primary/10 absolute -top-32 -right-32 size-96 rounded-full blur-3xl" />
          <Logo />
          <div className="relative max-w-md">
            <h1 className="text-4xl leading-tight font-semibold tracking-tight">
              Seus orçamentos, mais <span className="text-primary">rápidos</span> e profissionais.
            </h1>
            <p className="text-sidebar-foreground/70 mt-4">
              Crie propostas elegantes em poucos cliques, acompanhe aprovações e compartilhe com seus
              clientes pelo WhatsApp.
            </p>
            <div className="mt-10 w-80 -rotate-2 rounded-xl bg-white p-5 text-[#17191D] shadow-2xl">
              <div className="flex items-center justify-between">
                <FileText className="text-primary size-5" />
                <span className="text-muted-foreground text-xs">ORC-2026-0048</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="bg-secondary h-2 w-3/4 rounded" />
                <div className="bg-secondary h-2 w-1/2 rounded" />
              </div>
              <div className="mt-4 space-y-1.5 text-xs">
                {['Projeto de interiores', 'Luminária pendente'].map((i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="text-success size-3.5" /> {i}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground text-xs">Total</span>
                <span className="font-semibold">R$ 7.099,60</span>
              </div>
            </div>
          </div>
          <p className="text-sidebar-foreground/40 relative text-xs">© 2026 Orçamento na Hora</p>
        </section>
        <section className="bg-background flex items-center justify-center p-10">
          <div className="bg-card w-full max-w-md rounded-xl border p-8 shadow-sm">{children}</div>
        </section>
      </div>
    </ToastProvider>
  )
}
