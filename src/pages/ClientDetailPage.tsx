import { ArrowLeft, Building2, Mail, MapPin, Phone } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/States'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { formatCurrency, formatDate, quoteTotal } from '@/lib/format'
import { UserX } from 'lucide-react'
import { clientQuotes, getClient } from '@/mocks/store'

export default function ClientDetailPage() {
  const { id = '' } = useParams()
  const client = getClient(id)

  if (!client) {
    return <Card><EmptyState icon={UserX} title="Cliente não encontrado" action={<Button asChild><Link to="/clientes">Voltar para clientes</Link></Button>} /></Card>
  }

  const qs = clientQuotes(id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const total = qs.reduce((s, q) => s + quoteTotal(q), 0)

  return (
    <>
      <Link to="/clientes" className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"><ArrowLeft className="size-4" /> Clientes</Link>
      <PageHeader title={client.name} description={client.company} actions={<Button asChild><Link to="/orcamentos/novo">+ Novo orçamento</Link></Button>} />
      <div className="grid grid-cols-3 gap-5">
        <Card className="gap-3 p-6">
          <h2 className="font-semibold">Informações cadastrais</h2>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li className="flex gap-2"><Phone className="size-4" /> {client.phone}</li>
            <li className="flex gap-2"><Mail className="size-4" /> {client.email}</li>
            <li className="flex gap-2"><Building2 className="size-4" /> {client.company}</li>
            <li className="flex gap-2"><MapPin className="size-4" /> {client.city}</li>
          </ul>
          <div className="mt-2 border-t pt-4">
            <p className="text-muted-foreground text-xs">Valor total orçado</p>
            <p className="text-2xl font-semibold">{formatCurrency(total)}</p>
          </div>
        </Card>
        <Card className="col-span-2 gap-0 p-0">
          <h2 className="p-6 pb-3 font-semibold">Histórico de orçamentos</h2>
          {qs.length === 0 ? (
            <EmptyState icon={UserX} title="Sem orçamentos" description="Este cliente ainda não recebeu propostas." />
          ) : (
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>Número</TH><TH>Data</TH><TH>Valor</TH><TH>Status</TH></TR></THead>
              <TBody>
                {qs.map((q) => (
                  <TR key={q.id}><TD className="font-medium">{q.number}</TD><TD>{formatDate(q.createdAt)}</TD><TD>{formatCurrency(quoteTotal(q))}</TD><TD><StatusBadge status={q.status} /></TD></TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
      <Card className="mt-5 gap-3 p-6">
        <h2 className="font-semibold">Últimas atividades</h2>
        <ul className="text-muted-foreground space-y-2 text-sm">
          {qs.slice(0, 3).map((q) => <li key={q.id}>{formatDate(q.createdAt)} — Orçamento {q.number} criado</li>)}
          <li>{formatDate(client.createdAt)} — Cliente cadastrado</li>
        </ul>
      </Card>
    </>
  )
}
