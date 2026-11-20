import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ClientFormModal } from '@/components/shared/ClientFormModal'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { useMockLoad } from '@/hooks/useMockLoad'
import { formatDate } from '@/lib/format'
import { clientQuotes, db } from '@/mocks/store'

export default function ClientsPage() {
  const loading = useMockLoad()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [, force] = useState(0)

  const rows = db.clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <PageHeader title="Clientes" description="Encontre e gerencie sua base de clientes" actions={<Button onClick={() => setOpen(true)}>+ Novo cliente</Button>} />
      <Card className="gap-0 p-0">
        <div className="border-b p-4">
          <div className="relative max-w-md">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input aria-label="Buscar cliente" placeholder="Buscar por nome ou e-mail" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum cliente encontrado" description="Cadastre seu primeiro cliente para começar." action={<Button onClick={() => setOpen(true)}>+ Novo cliente</Button>} />
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Nome</TH><TH>Telefone</TH><TH>E-mail</TH><TH>Orçamentos</TH><TH>Último orçamento</TH><TH><span className="sr-only">Ações</span></TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((c) => {
                const qs = clientQuotes(c.id)
                const last = qs.map((q) => q.createdAt).sort().reverse()[0]
                return (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.name}</TD>
                    <TD>{c.phone}</TD>
                    <TD className="text-muted-foreground">{c.email}</TD>
                    <TD>{qs.length}</TD>
                    <TD className="text-muted-foreground">{last ? formatDate(last) : '—'}</TD>
                    <TD><Button asChild variant="outline" size="sm"><Link to={`/clientes/${c.id}`}>Ver detalhes</Link></Button></TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
      </Card>
      <ClientFormModal open={open} onOpenChange={setOpen} onSaved={(c) => { toast(`Cliente ${c.name} cadastrado.`); force((n) => n + 1) }} />
    </>
  )
}
