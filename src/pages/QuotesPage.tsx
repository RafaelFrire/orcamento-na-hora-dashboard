import { Ban, CheckCircle2, CircleDashed, Download, Eye, FileSearch, FileText, MoreHorizontal, Search, Send, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { CancelQuoteModal } from '@/features/quotes/CancelQuoteModal'
import { QuoteStatusBadge } from '@/features/quotes/QuoteStatusBadge'
import { cancelCategoryLabels, outcomeLabels } from '@/features/quotes/labels'
import { SendQuoteModal } from '@/components/shared/SendQuoteModal'
import { ErrorNotice, Pager } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { errorMessage, useApi, useDebounced } from '@/hooks/useApi'
import { useQuoteActions } from '@/hooks/useQuoteActions'
import { formatCurrency, formatDate, formatQuantity, formatQuoteNumber, unitLabel } from '@/lib/format'
import { quotesService } from '@/services/quotes'
import type { Quote, QuoteOutcome, QuoteStatus } from '@/types'

/** Filtro "Situação" da tabela -> filtros da API. */
const situations: Record<string, { label: string; status?: QuoteStatus; outcome?: QuoteOutcome }> = {
  all: { label: 'Todas as situações' },
  PENDING: { label: 'Em aberto', status: 'ACTIVE', outcome: 'PENDING' },
  WON: { label: 'Fechados', status: 'ACTIVE', outcome: 'WON' },
  LOST: { label: 'Não fechados', status: 'ACTIVE', outcome: 'LOST' },
  CANCELED: { label: 'Cancelados', status: 'CANCELED' },
}

/** Data (yyyy-MM-dd) de N dias atrás, para o filtro `from` da API. */
function daysAgo(days: number) {
  const d = new Date(Date.now() - days * 86_400_000)
  return d.toISOString().slice(0, 10)
}

function QuoteDetail({ id }: { id: string }) {
  const { data, loading, error, reload } = useApi(() => quotesService.get(id), [id])
  if (error) return <ErrorNotice message={error} onRetry={reload} />
  if (loading || !data) return <TableSkeleton rows={3} />
  return (
    <div className="space-y-2 text-sm">
      {data.items?.map((i) => (
        <div key={i.id} className="flex justify-between gap-4">
          <span>{formatQuantity(i.quantity)} {unitLabel(i.unit)} × {i.name}</span>
          <span>{formatCurrency(i.subtotal)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t pt-2 font-semibold">
        <span>Total</span><span>{formatCurrency(data.total)}</span>
      </div>
      {data.status === 'CANCELED' && (
        <div role="note" className="bg-destructive/10 text-destructive space-y-1 rounded-md p-3">
          <p className="font-semibold">
            Cancelado{data.canceledAt ? ` em ${formatDate(data.canceledAt)}` : ''}
            {data.cancelCategory ? ` · ${cancelCategoryLabels[data.cancelCategory]}` : ''}
          </p>
          {data.cancelReason && <p className="whitespace-pre-line">{data.cancelReason}</p>}
        </div>
      )}
      {data.validUntil && <p className="text-muted-foreground text-xs">Válido até {formatDate(data.validUntil)}</p>}
      {data.notes && <p className="text-muted-foreground bg-secondary/50 rounded-md p-2 whitespace-pre-line">{data.notes}</p>}
    </div>
  )
}

export default function QuotesPage() {
  const actions = useQuoteActions()
  const toast = useToast()
  const [canceling, setCanceling] = useState<Quote | null>(null)
  const [situation, setSituation] = useState('all')
  const [sendingQuote, setSendingQuote] = useState<Quote | null>(null)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('all')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<Quote | null>(null)
  const q = useDebounced(search.trim())

  const { data, loading, error, reload } = useApi(
    () =>
      quotesService.list({
        page,
        pageSize: 20,
        q,
        from: period === 'all' ? undefined : daysAgo(Number(period)),
        status: situations[situation].status,
        outcome: situations[situation].outcome,
      }),
    [page, q, period, situation],
  )
  const rows = data?.data ?? []

  async function markOutcome(row: Quote, outcome: QuoteOutcome) {
    try {
      await quotesService.setOutcome(row.id, outcome)
      toast(`${formatQuoteNumber(row.number)}: ${outcomeLabels[outcome].toLowerCase()}.`)
      reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Gerencie e acompanhe suas propostas comerciais"
        actions={<Button asChild><Link to="/orcamentos/novo">+ Novo orçamento</Link></Button>}
      />

      <Card className="gap-0 p-0">
        <div className="flex items-center gap-3 border-b p-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input aria-label="Buscar por cliente ou número" placeholder="Buscar por cliente ou número" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <Select aria-label="Filtrar por período" className="w-44" value={period} onChange={(e) => { setPeriod(e.target.value); setPage(1) }}>
            <option value="all">Todo o período</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </Select>
          <Select aria-label="Filtrar por situação" className="w-48" value={situation} onChange={(e) => { setSituation(e.target.value); setPage(1) }}>
            {Object.entries(situations).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          {data && <span className="text-muted-foreground w-28 text-right text-sm">{data.pagination.total} orçamentos</span>}
        </div>

        {error ? (
          <ErrorNotice message={error} onRetry={reload} />
        ) : loading && !data ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="Nenhum orçamento encontrado"
            description="Ajuste os filtros ou crie um novo orçamento."
            action={<Button asChild><Link to="/orcamentos/novo">+ Novo orçamento</Link></Button>}
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Número</TH><TH>Cliente</TH><TH>Criado em</TH><TH>Válido até</TH><TH>Itens</TH><TH>Valor total</TH><TH>Situação</TH><TH className="w-12"><span className="sr-only">Ações</span></TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((row) => {
                  const number = formatQuoteNumber(row.number)
                  return (
                    <TR key={row.id}>
                      <TD className="font-medium">{number}</TD>
                      <TD>{row.customer.name}</TD>
                      <TD className="text-muted-foreground">{formatDate(row.createdAt)}</TD>
                      <TD className="text-muted-foreground">{row.validUntil ? formatDate(row.validUntil) : '—'}</TD>
                      <TD>{row.itemsCount}</TD>
                      <TD className={row.status === 'CANCELED' ? 'text-muted-foreground line-through' : undefined}>{formatCurrency(row.total)}</TD>
                      <TD><QuoteStatusBadge quote={row} /></TD>
                      <TD>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Ações de ${number}`}><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setViewing(row)}><Eye /> Visualizar</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => actions.viewPdf(row)}><FileText /> Abrir PDF</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => actions.download(row)}><Download /> Baixar PDF</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={row.status === 'CANCELED'} onSelect={() => setSendingQuote(row)}><Send /> Enviar ao cliente</DropdownMenuItem>
                            {row.status === 'ACTIVE' && (
                              <>
                                <DropdownMenuSeparator />
                                {row.outcome !== 'WON' && <DropdownMenuItem onSelect={() => markOutcome(row, 'WON')}><CheckCircle2 /> Marcar como fechado</DropdownMenuItem>}
                                {row.outcome !== 'LOST' && <DropdownMenuItem onSelect={() => markOutcome(row, 'LOST')}><XCircle /> Marcar como não fechado</DropdownMenuItem>}
                                {row.outcome !== 'PENDING' && <DropdownMenuItem onSelect={() => markOutcome(row, 'PENDING')}><CircleDashed /> Voltar para em aberto</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onSelect={() => setCanceling(row)}><Ban /> Cancelar orçamento</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
            {data && <Pager pagination={data.pagination} onPage={setPage} />}
          </>
        )}
      </Card>

      <CancelQuoteModal quote={canceling} onClose={() => setCanceling(null)} onCanceled={reload} />
      <SendQuoteModal quote={sendingQuote} onClose={() => setSendingQuote(null)} />

      <Modal
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing ? formatQuoteNumber(viewing.number) : ''}
        description={viewing ? `${viewing.customer.name} · ${formatDate(viewing.createdAt)}` : ''}
      >
        {viewing && <QuoteDetail id={viewing.id} />}
      </Modal>
    </>
  )
}
