import { Check } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { planService, type PlanOffer, type PlanUsage } from '@/services/plan'

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {used} / {limit}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full"
      >
        <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-destructive' : pct >= 80 ? 'bg-warning' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CurrentPlan({ usage }: { usage: PlanUsage }) {
  const trial = usage.plan === 'TRIAL'
  return (
    <Card className="mb-6">
      <CardContent className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Seu plano</p>
          <p className="mt-1 text-2xl font-semibold">{usage.label}</p>
          {trial && (
            <p className="text-muted-foreground mt-1 text-sm">
              {usage.expired
                ? 'Seu período de teste terminou.'
                : `Teste grátis: ${usage.daysLeft ?? 0} ${usage.daysLeft === 1 ? 'dia restante' : 'dias restantes'}.`}
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <UsageMeter label="Orçamentos" used={usage.quotes.used} limit={usage.quotes.limit} />
          <UsageMeter label="Usuários" used={usage.users.used} limit={usage.users.limit} />
          {usage.aiDrafts && <UsageMeter label="Rascunhos com IA" used={usage.aiDrafts.used} limit={usage.aiDrafts.limit} />}
          {usage.catalogItems && <UsageMeter label="Itens no catálogo" used={usage.catalogItems.used} limit={usage.catalogItems.limit} />}
        </div>
      </CardContent>
    </Card>
  )
}

function PlanCard({ offer, current }: { offer: PlanOffer; current: boolean }) {
  const { limits } = offer
  const facts = [
    limits.users === 1 ? '1 usuário' : `Até ${limits.users} usuários`,
    `${limits.quotes} orçamentos por mês`,
    `${limits.aiDrafts} gerações com IA por mês`,
    `Catálogo de até ${limits.catalogItems.toLocaleString('pt-BR')} itens`,
  ]
  return (
    <Card className={cn('relative', offer.recommended && 'border-primary ring-primary/30 ring-2')}>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="min-h-5">
          {offer.recommended && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">Minha recomendação</span>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{offer.label}</h2>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {formatCurrency(offer.priceCents / 100)}
            <span className="text-muted-foreground text-sm font-normal"> /mês</span>
          </p>
          <p className="text-muted-foreground mt-2 text-sm">{offer.tagline}</p>
        </div>
        <ul className="flex-1 space-y-2 text-sm">
          {[...facts, ...offer.features].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 size-4 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button variant={offer.recommended ? 'default' : 'outline'} disabled>
          {current ? 'Plano atual' : 'Assinatura em breve'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function PlansPage() {
  const usage = useApi(() => planService.get(), [])
  const offers = useApi(() => planService.offers(), [])

  return (
    <>
      <PageHeader title="Planos" description="Compare os planos e acompanhe o uso da sua empresa." />
      {usage.error && <ErrorNotice message={usage.error} onRetry={usage.reload} />}
      {usage.data && <CurrentPlan usage={usage.data} />}
      {offers.error && <ErrorNotice message={offers.error} onRetry={offers.reload} />}
      {offers.loading && !offers.data && <TableSkeleton rows={3} />}
      {offers.data && (
        <div className="grid gap-4 lg:grid-cols-3">
          {offers.data.map((o) => (
            <PlanCard key={o.key} offer={o} current={usage.data?.plan === o.key} />
          ))}
        </div>
      )}
      <p className="text-muted-foreground mt-4 text-sm">
        A contratação online chega em breve. Enquanto isso, fale com a gente para trocar de plano.
      </p>
    </>
  )
}
