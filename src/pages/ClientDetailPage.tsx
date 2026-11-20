import { ArrowLeft, Mail, Phone, UserX } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate, formatQuoteNumber, toNumber } from '@/lib/format'
import { ApiError } from '@/services/api'
import { customersService } from '@/services/customers'
import { quotesService } from '@/services/quotes'

export default function ClientDetailPage() {
  const { id = '' } = useParams()
  const customer = useApi(async () => {
    try {
      return await customersService.get(id)
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null
      throw e
    }
  }, [id])
  const quotes = useApi(() => quotesService.list({ customerId: id, pageSize: 100 }), [id])

  if (customer.loading && customer.data === null && !customer.error) return <Card><TableSkeleton rows={4} /></Card>

  if (customer.error) {
    return <Card><ErrorNotice message={customer.error} onRetry={customer.reload} /></Card>
  }

  const client = customer.data
  if (!client) {
    return <Card><EmptyState icon={UserX} title="Cliente não encontrado" action={<Button asChild><Link to="/clientes">Voltar para clientes</Link></Button>} /></Card>
  }

  const qs = quotes.data?.data ?? []
  const total = qs.reduce((s, q) => s + toNumber(q.total), 0)

  return (
    <>
      <Link to="/clientes" className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"><ArrowLeft className="size-4" /> Clientes</Link>
      <PageHeader title={client.name} description={`Cliente desde ${formatDate(client.createdAt)}`} actions={<Button asChild><Link to="/orcamentos/novo" state={{ customer: client }}>+ Novo orçamento</Link></Button>} />
      <div className="grid grid-cols-3 gap-5">
        <Card className="gap-3 p-6">
          <h2 className="font-semibold">Informações cadastrais</h2>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li className="flex gap-2"><Phone className="size-4" /> {client.phone ?? '—'}</li>
            <li className="flex gap-2"><Mail className="size-4" /> {client.email ?? '—'}</li>
          </ul>
          <div className="mt-2 border-t pt-4">
            <p className="text-muted-foreground text-xs">Valor total orçado</p>
            <p className="text-2xl font-semibold">{formatCurrency(total)}</p>
          </div>
        </Card>
        <Card className="col-span-2 gap-0 p-0">
          <h2 className="p-6 pb-3 font-semibold">Histórico de orçamentos</h2>
          {quotes.error ? (
            <ErrorNotice message={quotes.error} onRetry={quotes.reload} />
          ) : quotes.loading && !quotes.data ? (
            <TableSkeleton rows={3} />
          ) : qs.length === 0 ? (
            <EmptyState icon={UserX} title="Sem orçamentos" description="Este cliente ainda não recebeu propostas." />
          ) : (
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>Número</TH><TH>Data</TH><TH>Itens</TH><TH>Valor</TH></TR></THead>
              <TBody>
                {qs.map((q) => (
                  <TR key={q.id}><TD className="font-medium">{formatQuoteNumber(q.number)}</TD><TD>{formatDate(q.createdAt)}</TD><TD>{q.itemsCount}</TD><TD>{formatCurrency(q.total)}</TD></TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
      <Card className="mt-5 gap-3 p-6">
        <h2 className="font-semibold">Últimas atividades</h2>
        <ul className="text-muted-foreground space-y-2 text-sm">
          {qs.slice(0, 3).map((q) => <li key={q.id}>{formatDate(q.createdAt)} — Orçamento {formatQuoteNumber(q.number)} criado</li>)}
          <li>{formatDate(client.createdAt)} — Cliente cadastrado</li>
        </ul>
      </Card>
    </>
  )
}
