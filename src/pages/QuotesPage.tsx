import { Copy, Download, FileSearch, MoreHorizontal, Pencil, Search, Send, Trash2, Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog, Modal } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { useMockLoad } from '@/hooks/useMockLoad'
import { formatCurrency, formatDate, quoteTotal } from '@/lib/format'
import { cn } from '@/lib/utils'
import { db, getClient, nextQuoteNumber } from '@/mocks/store'
import type { Quote, QuoteStatus } from '@/types'

const REF_DATE = new Date('2026-11-19')
const tabs: { key: 'all' | QuoteStatus; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'rejected', label: 'Rejeitados' },
]

export default function QuotesPage() {
  const loading = useMockLoad()
  const navigate = useNavigate()
  const toast = useToast()
  const [, force] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | QuoteStatus>('all')
  const [period, setPeriod] = useState('all')
  const [sort, setSort] = useState('date-desc')
  const [viewing, setViewing] = useState<Quote | null>(null)
  const [deleting, setDeleting] = useState<Quote | null>(null)

  const counts = (k: 'all' | QuoteStatus) =>
    k === 'all' ? db.quotes.length : db.quotes.filter((q) => q.status === k).length

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    let r = db.quotes.filter((q) => {
      if (status !== 'all' && q.status !== status) return false
      if (term && !q.number.toLowerCase().includes(term) && !getClient(q.clientId)?.name.toLowerCase().includes(term)) return false
      if (period !== 'all') {
        const days = (REF_DATE.getTime() - new Date(q.createdAt).getTime()) / 86400000
        if (days > Number(period)) return false
      }
      return true
    })
    r = [...r].sort((a, b) => {
      switch (sort) {
        case 'date-asc': return a.createdAt.localeCompare(b.createdAt)
        case 'value-desc': return quoteTotal(b) - quoteTotal(a)
        case 'value-asc': return quoteTotal(a) - quoteTotal(b)
        default: return b.createdAt.localeCompare(a.createdAt)
      }
    })
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, period, sort, db.quotes.length])

  function duplicate(q: Quote) {
    const id = `q${Date.now()}`
    db.quotes.unshift({ ...q, id, number: nextQuoteNumber(), status: 'pending', createdAt: '2026-11-19' })
    force((n) => n + 1)
    toast(`Orçamento duplicado como ${db.quotes[0].number}.`)
  }

  function remove(q: Quote) {
    db.quotes.splice(db.quotes.indexOf(q), 1)
    force((n) => n + 1)
    toast('Orçamento excluído.')
  }

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Gerencie e acompanhe suas propostas comerciais"
        actions={<Button asChild><Link to="/orcamentos/novo">+ Novo orçamento</Link></Button>}
      />

      <div className="mb-5 grid grid-cols-4 gap-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={status === t.key}
            onClick={() => setStatus(t.key)}
            className={cn(
              'bg-card rounded-xl border p-4 text-left transition-colors hover:border-primary/60',
              status === t.key && 'border-primary ring-primary/20 ring-2',
            )}
          >
            <p className="text-muted-foreground text-sm">{t.label}</p>
            <p className="text-2xl font-semibold">{counts(t.key)}</p>
          </button>
        ))}
      </div>

      <Card className="gap-0 p-0">
        <div className="flex items-center gap-3 border-b p-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input aria-label="Buscar por cliente ou número" placeholder="Buscar por cliente ou número" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select aria-label="Filtrar por status" className="w-44" value={status} onChange={(e) => setStatus(e.target.value as 'all' | QuoteStatus)}>
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
          </Select>
          <Select aria-label="Filtrar por período" className="w-44" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">Todo o período</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </Select>
          <Select aria-label="Ordenar" className="w-48" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date-desc">Mais recentes</option>
            <option value="date-asc">Mais antigos</option>
            <option value="value-desc">Maior valor</option>
            <option value="value-asc">Menor valor</option>
          </Select>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="Nenhum orçamento encontrado"
            description="Ajuste os filtros ou crie um novo orçamento."
            action={<Button asChild><Link to="/orcamentos/novo">+ Novo orçamento</Link></Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Número</TH><TH>Cliente</TH><TH>Criado em</TH><TH>Valor total</TH><TH>Status</TH><TH className="w-12"><span className="sr-only">Ações</span></TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((q) => (
                <TR key={q.id}>
                  <TD className="font-medium">{q.number}</TD>
                  <TD>{getClient(q.clientId)?.name}</TD>
                  <TD className="text-muted-foreground">{formatDate(q.createdAt)}</TD>
                  <TD>{formatCurrency(quoteTotal(q))}</TD>
                  <TD><StatusBadge status={q.status} /></TD>
                  <TD>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Ações de ${q.number}`}><MoreHorizontal className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setViewing(q)}><Eye /> Visualizar</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/orcamentos/novo')}><Pencil /> Editar</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => duplicate(q)}><Copy /> Duplicar</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast(`PDF de ${q.number} baixado.`)}><Download /> Baixar PDF</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast('Abrindo o WhatsApp para compartilhar.')}><Send /> Compartilhar pelo WhatsApp</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(q)}><Trash2 /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.number ?? ''}
        description={viewing ? `${getClient(viewing.clientId)?.name} · ${formatDate(viewing.createdAt)}` : ''}
      >
        {viewing && (
          <div className="space-y-2 text-sm">
            {viewing.items.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span>{i.quantity} {i.unit} × {i.name}</span>
                <span>{formatCurrency(i.quantity * i.unitPrice)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span><span>{formatCurrency(quoteTotal(viewing))}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir orçamento?"
        description={`O orçamento ${deleting?.number ?? ''} será removido permanentemente.`}
        onConfirm={() => deleting && remove(deleting)}
      />
    </>
  )
}
