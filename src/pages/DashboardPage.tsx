import { ArrowUpRight, CheckCircle2, Clock, FilePlus2, FileText, MessageCircle, PackagePlus, TrendingUp, UserPlus, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BarChart, DonutChart } from '@/components/shared/Charts'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { useMockLoad } from '@/hooks/useMockLoad'
import { formatCurrency, formatDate, quoteTotal } from '@/lib/format'
import { currentUser, monthlyVolume } from '@/mocks/data'
import { db, getClient } from '@/mocks/store'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function Kpi({ icon: Icon, label, value, hint, trend }: { icon: typeof FileText; label: string; value: string; hint: string; trend?: string }) {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="bg-accent text-primary flex size-9 items-center justify-center rounded-lg">
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {trend && (
          <span className="text-success flex items-center gap-0.5 font-medium">
            <TrendingUp className="size-3.5" /> {trend}
          </span>
        )}
        {hint}
      </p>
    </Card>
  )
}

const quickActions = [
  { label: 'Criar orçamento', to: '/orcamentos/novo', icon: FilePlus2 },
  { label: 'Cadastrar cliente', to: '/clientes', icon: UserPlus },
  { label: 'Adicionar produto', to: '/catalogo', icon: PackagePlus },
  { label: 'Conectar WhatsApp', to: '/whatsapp', icon: MessageCircle },
]

export default function DashboardPage() {
  const loading = useMockLoad()
  const quotes = db.quotes
  const approved = quotes.filter((q) => q.status === 'approved')
  const pending = quotes.filter((q) => q.status === 'pending')
  const rejected = quotes.filter((q) => q.status === 'rejected')
  const totalValue = quotes.reduce((s, q) => s + quoteTotal(q), 0)
  const conversion = Math.round((approved.length / quotes.length) * 100)

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${currentUser.name}`}
        description="Veja como estão seus orçamentos hoje."
        actions={
          <Button asChild>
            <Link to="/orcamentos/novo">+ Novo orçamento</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-5">
        <Kpi icon={FileText} label="Total de orçamentos" value={String(quotes.length)} trend="+12%" hint="vs. mês anterior" />
        <Kpi icon={Wallet} label="Valor total orçado" value={formatCurrency(totalValue)} trend="+18%" hint="vs. mês anterior" />
        <Kpi icon={CheckCircle2} label="Orçamentos aprovados" value={String(approved.length)} hint={`${conversion}% de conversão`} />
        <Kpi icon={Clock} label="Aguardando resposta" value={String(pending.length)} hint="orçamentos pendentes" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <Card className="col-span-2 p-6">
          <h2 className="font-semibold">Evolução de orçamentos</h2>
          <p className="text-muted-foreground text-sm">Últimos 6 meses</p>
          <BarChart data={monthlyVolume} />
        </Card>
        <Card className="p-6">
          <h2 className="mb-6 font-semibold">Orçamentos por status</h2>
          <DonutChart
            slices={[
              { label: 'Aprovados', value: approved.length, color: '#239B70' },
              { label: 'Pendentes', value: pending.length, color: '#D9BD87' },
              { label: 'Rejeitados', value: rejected.length, color: '#D9534F' },
            ]}
          />
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
          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Número</TH><TH>Cliente</TH><TH>Data</TH><TH>Valor</TH><TH>Status</TH><TH><span className="sr-only">Ação</span></TH>
                </TR>
              </THead>
              <TBody>
                {quotes.slice(0, 5).map((q) => (
                  <TR key={q.id}>
                    <TD className="font-medium">{q.number}</TD>
                    <TD>{getClient(q.clientId)?.name}</TD>
                    <TD className="text-muted-foreground">{formatDate(q.createdAt)}</TD>
                    <TD>{formatCurrency(quoteTotal(q))}</TD>
                    <TD><StatusBadge status={q.status} /></TD>
                    <TD>
                      <Link to="/orcamentos" aria-label={`Visualizar ${q.number}`} className="text-muted-foreground hover:text-foreground">
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
