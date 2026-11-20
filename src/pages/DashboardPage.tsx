import { ArrowUpRight, FilePlus2, FileText, MessageCircle, PackagePlus, UserPlus, Users, Wallet, CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { BarChart } from '@/components/shared/Charts'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate, formatQuoteNumber, monthKey, toNumber } from '@/lib/format'
import { customersService } from '@/services/customers'
import { quotesService } from '@/services/quotes'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const SAMPLE = 100

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

const quickActions = [
  { label: 'Criar orçamento', to: '/orcamentos/novo', icon: FilePlus2 },
  { label: 'Cadastrar cliente', to: '/clientes', icon: UserPlus },
  { label: 'Adicionar produto', to: '/catalogo', icon: PackagePlus },
  { label: 'Conectar WhatsApp', to: '/whatsapp', icon: MessageCircle },
]

/** Últimos 6 meses (incluindo o atual) com contagem e valor dos orçamentos. */
function lastSixMonths(quotes: { createdAt: string; total: string }[]) {
  const now = new Date()
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { key, month: MONTHS[d.getMonth()], count: 0, value: 0 }
  })
  for (const q of quotes) {
    const b = buckets.find((x) => x.key === monthKey(q.createdAt))
    if (b) {
      b.count += 1
      b.value += toNumber(q.total)
    }
  }
  return buckets
}

export default function DashboardPage() {
  const { user } = useAuth()
  const quotes = useApi(() => quotesService.list({ pageSize: SAMPLE }), [])
  const customers = useApi(() => customersService.list({ pageSize: 1 }), [])

  const stats = useMemo(() => {
    const list = quotes.data?.data ?? []
    const months = lastSixMonths(list)
    const current = months[months.length - 1]
    return {
      list,
      months,
      current,
      totalValue: list.reduce((s, q) => s + toNumber(q.total), 0),
      avgTicket: current.count ? current.value / current.count : 0,
    }
  }, [quotes.data])

  const total = quotes.data?.pagination.total ?? 0
  const partial = total > SAMPLE
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Veja como estão seus orçamentos hoje."
        actions={
          <Button asChild>
            <Link to="/orcamentos/novo">+ Novo orçamento</Link>
          </Button>
        }
      />

      {quotes.error && <Card className="mb-5"><ErrorNotice message={quotes.error} onRetry={quotes.reload} /></Card>}

      <div className="grid grid-cols-4 gap-5">
        <Kpi icon={FileText} label="Total de orçamentos" value={String(total)} hint="desde o início" />
        <Kpi icon={Wallet} label="Valor total orçado" value={formatCurrency(stats.totalValue)} hint={partial ? `nos ${SAMPLE} orçamentos mais recentes` : 'soma de todos os orçamentos'} />
        <Kpi icon={CalendarDays} label="Orçamentos no mês" value={String(stats.current.count)} hint={formatCurrency(stats.current.value)} />
        <Kpi icon={Users} label="Clientes" value={String(customers.data?.pagination.total ?? 0)} hint="na sua base" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <Card className="col-span-2 p-6">
          <h2 className="font-semibold">Evolução de orçamentos</h2>
          <p className="text-muted-foreground text-sm">Últimos 6 meses{partial ? ` · base: ${SAMPLE} mais recentes` : ''}</p>
          <BarChart data={stats.months} />
        </Card>
        <Card className="gap-4 p-6">
          <h2 className="font-semibold">Resumo do mês</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Orçamentos emitidos</dt><dd className="font-medium">{stats.current.count}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Valor orçado</dt><dd className="font-medium">{formatCurrency(stats.current.value)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Ticket médio</dt><dd className="font-medium">{formatCurrency(stats.avgTicket)}</dd></div>
          </dl>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <Card className="col-span-2 gap-0 p-0">
          <div className="flex items-center justify-between p-6 pb-3">
            <h2 className="font-semibold">Atividades recentes</h2>
            <Link to="/orcamentos" className="text-muted-foreground hover:text-foreground text-sm">
              Ver todos
            </Link>
          </div>
          {quotes.loading && !quotes.data ? (
            <TableSkeleton rows={5} />
          ) : stats.list.length === 0 ? (
            <EmptyState icon={FileText} title="Nenhum orçamento ainda" description="Crie o primeiro orçamento para vê-lo aqui." />
          ) : (
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Número</TH><TH>Cliente</TH><TH>Data</TH><TH>Valor</TH><TH><span className="sr-only">Ação</span></TH>
                </TR>
              </THead>
              <TBody>
                {stats.list.slice(0, 5).map((q) => (
                  <TR key={q.id}>
                    <TD className="font-medium">{formatQuoteNumber(q.number)}</TD>
                    <TD>{q.customer.name}</TD>
                    <TD className="text-muted-foreground">{formatDate(q.createdAt)}</TD>
                    <TD>{formatCurrency(q.total)}</TD>
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
