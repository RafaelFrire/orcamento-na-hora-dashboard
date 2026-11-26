import { ArrowUpRight, Ban, FilePlus2, FileText, MessageCircle, PackagePlus, Target, UserPlus, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EvolutionChart, HorizontalBars, type ChartMetric } from '@/components/shared/Charts'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import { QuoteStatusBadge } from '@/features/quotes/QuoteStatusBadge'
import { cancelCategoryLabels, formatPercent, periodLabels } from '@/features/quotes/labels'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate, formatQuoteNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { customersService } from '@/services/customers'
import { quotesService } from '@/services/quotes'
import type { StatsPeriod } from '@/types'

const PERIODS = Object.keys(periodLabels) as StatsPeriod[]
const METRICS: { value: ChartMetric; label: string }[] = [
  { value: 'count', label: 'Quantidade' },
  { value: 'value', label: 'Valor' },
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function Kpi({ icon: Icon, label, value, hint }: { icon: typeof FileText; label: string; value: string; hint: string }) {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="bg-accent text-primary flex size-9 items-center justify-center rounded-lg">
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </Card>
  )
}

/** Controle segmentado (Dia/Semana/Mês/Ano e Quantidade/Valor). */
function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="bg-secondary inline-flex rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            o.value === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const quickActions = [
  { label: 'Criar orçamento', to: '/orcamentos/novo', icon: FilePlus2 },
  { label: 'Cadastrar cliente', to: '/clientes', icon: UserPlus },
  { label: 'Adicionar produto', to: '/catalogo', icon: PackagePlus },
  { label: 'Conectar WhatsApp', to: '/whatsapp', icon: MessageCircle },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<StatsPeriod>('month')
  const [metric, setMetric] = useState<ChartMetric>('count')
  const stats = useApi(() => quotesService.stats(period), [period])
  const recent = useApi(() => quotesService.list({ pageSize: 5 }), [])
  const customers = useApi(() => customersService.list({ pageSize: 1 }), [])

  const data = stats.data
  const totals = data?.totals
  const info = periodLabels[period]
  const avgTicket = totals && totals.count ? totals.value / totals.count : 0
  const cancellations = data?.cancellations
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Veja como estão seus orçamentos."
        actions={
          <div className="flex items-center gap-3">
            <Segmented label="Período" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p, label: periodLabels[p].tab }))} />
            <Button asChild>
              <Link to="/orcamentos/novo">+ Novo orçamento</Link>
            </Button>
          </div>
        }
      />

      {stats.error && <Card className="mb-5"><ErrorNotice message={stats.error} onRetry={stats.reload} /></Card>}

      <div className="grid grid-cols-4 gap-5">
        <Kpi icon={FileText} label="Total de orçamentos" value={String(totals?.count ?? 0)} hint={`${info.hint} · sem cancelados`} />
        <Kpi icon={Wallet} label="Valor orçado" value={formatCurrency(totals?.value ?? 0)} hint="soma dos orçamentos ativos" />
        <Kpi
          icon={Target}
          label="Valor fechado"
          value={formatCurrency(totals?.wonValue ?? 0)}
          hint={data?.closeRate == null ? 'nenhum retorno de cliente registrado' : `taxa de fechamento ${formatPercent(data.closeRate)}`}
        />
        <Kpi icon={Users} label="Clientes" value={String(customers.data?.pagination.total ?? 0)} hint="na sua base" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <Card className="col-span-2 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Evolução de orçamentos</h2>
              <p className="text-muted-foreground text-sm">{info.title} · sem cancelados</p>
            </div>
            <Segmented label="Métrica do gráfico" value={metric} onChange={setMetric} options={METRICS} />
          </div>
          {data ? (
            <EvolutionChart data={data.buckets} metric={metric} ariaLabel={`${metric === 'count' ? 'Quantidade' : 'Valor'} de orçamentos — ${info.title.toLowerCase()}`} />
          ) : (
            <TableSkeleton rows={4} />
          )}
        </Card>
        <Card className="gap-4 p-6">
          <h2 className="font-semibold">Resultado do período</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Em aberto</dt><dd className="font-medium">{totals?.pendingCount ?? 0} · {formatCurrency(totals?.pendingValue ?? 0)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Fechados</dt><dd className="text-success font-medium">{totals?.wonCount ?? 0} · {formatCurrency(totals?.wonValue ?? 0)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Não fechados</dt><dd className="font-medium">{totals?.lostCount ?? 0} · {formatCurrency(totals?.lostValue ?? 0)}</dd></div>
            <div className="flex justify-between border-t pt-3"><dt className="text-muted-foreground">Taxa de fechamento</dt><dd className="font-medium">{formatPercent(data?.closeRate)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Ticket médio</dt><dd className="font-medium">{formatCurrency(avgTicket)}</dd></div>
          </dl>
          {!!totals?.pendingCount && (
            <p className="bg-accent text-accent-foreground rounded-md p-3 text-xs">
              {totals.pendingCount} orçamento{totals.pendingCount === 1 ? '' : 's'} sem retorno registrado. Marque se o cliente fechou para a taxa refletir a realidade.
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-5 gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-destructive/10 text-destructive flex size-9 items-center justify-center rounded-lg"><Ban className="size-4.5" /></span>
            <div>
              <h2 className="font-semibold">Orçamentos cancelados</h2>
              <p className="text-muted-foreground text-sm">{info.title}</p>
            </div>
          </div>
          <Link to="/orcamentos" className="text-muted-foreground hover:text-foreground text-sm">Ver cancelados na lista</Link>
        </div>

        {!totals?.canceledCount ? (
          <p className="text-muted-foreground text-sm">Nenhum orçamento cancelado neste período.</p>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            <dl className="grid grid-cols-3 content-start gap-3 text-sm">
              <div><dt className="text-muted-foreground text-xs">Cancelados</dt><dd className="text-xl font-semibold">{totals.canceledCount}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Taxa</dt><dd className="text-xl font-semibold">{formatPercent(data?.cancelRate)}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Valor</dt><dd className="text-xl font-semibold">{formatCurrency(totals.canceledValue)}</dd></div>
            </dl>
            <div>
              <h3 className="mb-3 text-sm font-medium">Por motivo</h3>
              <HorizontalBars
                rows={(cancellations?.byCategory ?? []).map((c) => ({ label: cancelCategoryLabels[c.category], count: c.count, hint: formatCurrency(c.value) }))}
              />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Últimos cancelamentos</h3>
              <ul className="space-y-3 text-sm">
                {cancellations?.recent.map((c) => (
                  <li key={c.id}>
                    <p className="font-medium">{formatQuoteNumber(c.number)} · {c.customerName}</p>
                    {c.reason && <p className="text-muted-foreground line-clamp-2 text-xs">{c.reason}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <Card className="col-span-2 gap-0 p-0">
          <div className="flex items-center justify-between p-6 pb-3">
            <h2 className="font-semibold">Atividades recentes</h2>
            <Link to="/orcamentos" className="text-muted-foreground hover:text-foreground text-sm">
              Ver todos
            </Link>
          </div>
          {recent.loading && !recent.data ? (
            <TableSkeleton rows={5} />
          ) : !recent.data?.data.length ? (
            <EmptyState icon={FileText} title="Nenhum orçamento ainda" description="Crie o primeiro orçamento para vê-lo aqui." />
          ) : (
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Número</TH><TH>Cliente</TH><TH>Data</TH><TH>Valor</TH><TH>Situação</TH><TH><span className="sr-only">Ação</span></TH>
                </TR>
              </THead>
              <TBody>
                {recent.data.data.map((q) => (
                  <TR key={q.id}>
                    <TD className="font-medium">{formatQuoteNumber(q.number)}</TD>
                    <TD>{q.customer.name}</TD>
                    <TD className="text-muted-foreground">{formatDate(q.createdAt)}</TD>
                    <TD>{formatCurrency(q.total)}</TD>
                    <TD><QuoteStatusBadge quote={q} /></TD>
                    <TD>
                      <Link to="/orcamentos" aria-label={`Visualizar ${formatQuoteNumber(q.number)}`} className="text-muted-foreground hover:text-foreground">
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Ações rápidas</h2>
          <div className="grid gap-2">
            {quickActions.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="hover:border-primary hover:bg-accent flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors"
              >
                <Icon className="text-primary size-4.5" /> {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
