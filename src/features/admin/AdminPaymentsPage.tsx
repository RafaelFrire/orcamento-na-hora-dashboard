import { CreditCard } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/form'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate } from '@/features/team/labels'
import { useApi } from '@/hooks/useApi'
import { formatCurrency } from '@/lib/format'
import { adminService } from '@/services/admin'

import { centsToReais, paymentStatusLabel, paymentStatusOptions } from './labels'

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState('')
  const payments = useApi(() => adminService.payments(status), [status])
  const total = payments.data?.payments.filter((p) => p.status === 'approved').reduce((sum, p) => sum + p.amountCents, 0) ?? 0

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description={payments.data ? `${payments.data.payments.length} cobrança(s) · ${formatCurrency(centsToReais(total))} aprovados na lista` : 'Cobranças recorrentes do Mercado Pago.'}
        actions={
          <Select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
            <option value="">Todos os status</option>
            {paymentStatusOptions.map((s) => (
              <option key={s} value={s}>{paymentStatusLabel(s)}</option>
            ))}
          </Select>
        }
      />
      <Card className="gap-0 p-0">
        {payments.error ? (
          <ErrorNotice message={payments.error} onRetry={payments.reload} />
        ) : !payments.data ? (
          <TableSkeleton />
        ) : payments.data.payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="Nenhum pagamento" description="Os pagamentos aparecem aqui quando houver cobranças." />
        ) : (
          <Table aria-label="Pagamentos">
            <THead>
              <TR>
                <TH>Empresa</TH>
                <TH>Plano</TH>
                <TH>Valor</TH>
                <TH>Status</TH>
                <TH>Data</TH>
              </TR>
            </THead>
            <TBody>
              {payments.data.payments.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <Link to={`/admin/empresas/${p.organization.id}`} className="font-medium underline-offset-4 hover:underline">{p.organization.name}</Link>
                  </TD>
                  <TD>{p.planLabel}</TD>
                  <TD>{formatCurrency(centsToReais(p.amountCents))}</TD>
                  <TD><Badge variant={p.status === 'approved' ? 'secondary' : 'outline'}>{paymentStatusLabel(p.status)}</Badge></TD>
                  <TD>{formatDate(p.paidAt ?? p.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  )
}
