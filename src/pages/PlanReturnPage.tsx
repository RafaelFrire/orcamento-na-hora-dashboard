import { CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import { planService } from '@/services/plan'

/** Quanto esperar o webhook ativar a assinatura antes de avisar que pode demorar. */
const WAIT_MS = 60_000

/**
 * Volta do checkout do Mercado Pago. Esta tela NÃO ativa nada: só acompanha o plano até o
 * webhook confirmar o pagamento no servidor.
 */
export default function PlanReturnPage() {
  const { data } = useApi(() => planService.get(), [], { pollMs: 3000 })
  const [timedOut, setTimedOut] = useState(false)
  const active = data?.subscription?.status === 'ACTIVE'

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), WAIT_MS)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <PageHeader title="Assinatura" />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          {active ? (
            <>
              <CheckCircle2 className="text-primary size-10" />
              <h2 className="text-lg font-semibold">Assinatura ativa!</h2>
              <p className="text-muted-foreground text-sm">Seu plano {data?.label} já está valendo.</p>
              <Button asChild>
                <Link to="/planos">Ver meu plano</Link>
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="text-muted-foreground size-10 animate-spin" />
              <h2 className="text-lg font-semibold">Confirmando pagamento…</h2>
              <p className="text-muted-foreground max-w-md text-sm">
                {timedOut
                  ? 'A confirmação está demorando mais que o normal. Você pode sair desta tela: assim que o Mercado Pago confirmar, seu plano é ativado automaticamente.'
                  : 'Estamos aguardando a confirmação do Mercado Pago. Isso costuma levar alguns segundos.'}
              </p>
              {timedOut && (
                <Button asChild variant="outline">
                  <Link to="/planos">Voltar para os planos</Link>
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
