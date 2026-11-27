import { Building2, CreditCard, FileText, LifeBuoy, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { HorizontalBars } from '@/components/shared/Charts'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate } from '@/features/team/labels'
import { useApi } from '@/hooks/useApi'
import { formatCurrency } from '@/lib/format'
import { adminService } from '@/services/admin'

import { Kpi } from './Kpi'
import { centsToReais, daysUntil, paymentStatusLabel, subscriptionLabel } from './labels'

export default function AdminOverviewPage() {
  const overview = useApi(() => adminService.overview(), [], { pollMs: 60_000 })

  if (overview.error) return <ErrorNotice message={overview.error} onRetry={overview.reload} />
  if (!overview.data) return <TableSkeleton rows={6} />
  const o = overview.data

  const live = o.organizations.total - o.organizations.disabled

  return (
    <>
      <PageHeader title="Visão geral" description="Saúde da plataforma: empresas, receita e atividade dos últimos 30 dias." />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Building2} label="Empresas" value={String(o.organizations.total)} hint={`${live} ativas · ${o.organizations.disabled} desativadas · ${o.organizations.new30d} novas em 30 dias`} />
        <Kpi icon={Users} label="Usuários" value={String(o.users.total)} />
        <Kpi icon={TrendingUp} label="Receita recorrente (MRR)" value={formatCurrency(centsToReais(o.revenue.mrrCents))} hint={o.revenue.atRiskCents ? `${formatCurrency(centsToReais(o.revenue.atRiskCents))} em atraso` : 'Nenhuma cobrança em atraso'} />
        <Kpi icon={CreditCard} label="Recebido em 30 dias" value={formatCurrency(centsToReais(o.revenue.received30dCents))} hint="Pagamentos aprovados" />
        <Kpi icon={FileText} label="Orçamentos em 30 dias" value={String(o.activity30d.quotes)} hint={`${o.activity30d.aiDrafts} rascunhos gerados por IA`} />
        <Kpi icon={LifeBuoy} label="Chamados abertos" value={String(o.openTickets)} hint="Pedidos dos proprietários" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="gap-4 p-6">
          <h2 className="font-semibold">Empresas por plano</h2>
          {o.plans.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma empresa ativa.</p>
          ) : (
            <HorizontalBars barClassName="bg-primary/70" rows={o.plans.map((p) => ({ label: p.label, count: p.count }))} />
          )}
        </Card>
        <Card className="gap-4 p-6">
          <h2 className="font-semibold">Assinaturas</h2>
          {o.subscriptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma assinatura criada ainda.</p>
          ) : (
            <HorizontalBars barClassName="bg-primary/70" rows={o.subscriptions.map((s) => ({ label: subscriptionLabel[s.status], count: s.count }))} />
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="gap-3 p-6">
          <h2 className="font-semibold">Atenção</h2>
          {o.trialsEnding.length === 0 && o.pastDue.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nada pedindo atenção agora.</p>
          ) : (
            <ul className="divide-y text-sm">
              {o.pastDue.map((s) => (
                <li key={`pd-${s.id}`} className="flex items-center justify-between gap-3 py-2">
                  <Link to={`/admin/empresas/${s.id}`} className="font-medium underline-offset-4 hover:underline">{s.name}</Link>
                  <Badge variant="destructive">Pagamento em atraso{s.graceEndsAt ? ` · carência até ${formatDate(s.graceEndsAt)}` : ''}</Badge>
                </li>
              ))}
              {o.trialsEnding.map((t) => {
                const d = daysUntil(t.trialEndsAt)
                return (
                  <li key={`tr-${t.id}`} className="flex items-center justify-between gap-3 py-2">
                    <Link to={`/admin/empresas/${t.id}`} className="font-medium underline-offset-4 hover:underline">{t.name}</Link>
                    <Badge variant="outline">{d !== null && d <= 0 ? 'Trial expirado' : `Trial termina em ${d} dia(s)`}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="font-semibold">Últimos pagamentos</h2>
            <Link to="/admin/pagamentos" className="text-muted-foreground hover:text-foreground text-sm">Ver todos</Link>
          </div>
          {o.recentPayments.length === 0 ? (
            <EmptyState icon={CreditCard} title="Nenhum pagamento" description="Os pagamentos do Mercado Pago aparecem aqui." />
          ) : (
            <Table aria-label="Últimos pagamentos">
              <THead>
                <TR>
                  <TH>Empresa</TH>
                  <TH>Valor</TH>
                  <TH>Status</TH>
                  <TH>Data</TH>
                </TR>
              </THead>
              <TBody>
                {o.recentPayments.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <Link to={`/admin/empresas/${p.organization.id}`} className="font-medium underline-offset-4 hover:underline">{p.organization.name}</Link>
                    </TD>
                    <TD>{formatCurrency(centsToReais(p.amountCents))}</TD>
                    <TD><Badge variant={p.status === 'approved' ? 'secondary' : 'outline'}>{paymentStatusLabel(p.status)}</Badge></TD>
                    <TD>{formatDate(p.paidAt ?? p.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
