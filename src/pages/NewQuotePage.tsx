import { CheckCircle2, Download, Eye, Plus, Search, Send, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { ClientFormModal } from '@/components/shared/ClientFormModal'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Textarea } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { errorMessage, useApi, useDebounced } from '@/hooks/useApi'
import { useQuoteActions } from '@/hooks/useQuoteActions'
import { formatCurrency, formatQuoteNumber, lineTotal, unitLabel } from '@/lib/format'
import { catalogService } from '@/services/catalog'
import { customersService } from '@/services/customers'
import { quotesService } from '@/services/quotes'
import { templateService } from '@/services/template'
import type { CatalogItem, Customer, Quote } from '@/types'

interface DraftItem {
  key: string
  catalogItemId: string
  name: string
  description: string
  unit: string
  basePrice: number
  quantity: number
  unitPrice: number
}

function SectionCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-4 p-6">
      <h2 className="flex items-center gap-2.5 font-semibold">
        <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs">{step}</span>
        {title}
      </h2>
      {children}
    </Card>
  )
}

export default function NewQuotePage() {
  const actions = useQuoteActions()
  const preset = (useLocation().state as { customer?: Customer } | null)?.customer ?? null
  const [client, setClient] = useState<Customer | null>(preset)
  const [clientQuery, setClientQuery] = useState('')
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [catalogQuery, setCatalogQuery] = useState('')
  const [items, setItems] = useState<DraftItem[]>([])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<Quote | null>(null)

  const cq = useDebounced(clientQuery.trim())
  const pq = useDebounced(catalogQuery.trim())
  const clientSearch = useApi(() => (cq ? customersService.list({ q: cq, pageSize: 8 }) : Promise.resolve(null)), [cq])
  const catalogSearch = useApi(
    () => (pq ? catalogService.items({ q: pq, active: true, pageSize: 8 }) : Promise.resolve(null)),
    [pq],
  )
  const template = useApi(() => templateService.get(), [])

  const clientMatches = clientQuery.trim() ? (clientSearch.data?.data ?? []) : []
  const catalogMatches = catalogQuery.trim() ? (catalogSearch.data?.data ?? []) : []
  const searchingClients = !!clientQuery.trim() && (clientSearch.loading || cq !== clientQuery.trim())
  const searchingCatalog = !!catalogQuery.trim() && (catalogSearch.loading || pq !== catalogQuery.trim())

  const total = items.reduce((s, i) => s + lineTotal(i.quantity, i.unitPrice), 0)

  function addItem(p: CatalogItem) {
    const price = Number(p.basePrice)
    setItems((s) => [
      ...s,
      { key: `${p.id}-${Date.now()}-${s.length}`, catalogItemId: p.id, name: p.name, description: p.description ?? '', unit: p.unit, basePrice: price, quantity: 1, unitPrice: price },
    ])
    setCatalogQuery('')
    setError('')
  }

  const patch = (key: string, p: Partial<DraftItem>) =>
    setItems((s) => s.map((i) => (i.key === key ? { ...i, ...p } : i)))

  async function save() {
    if (!client) return setError('Selecione um cliente para continuar.')
    if (items.length === 0) return setError('Adicione ao menos um item ao orçamento.')
    if (items.some((i) => !(i.quantity > 0))) return setError('A quantidade de cada item deve ser maior que zero.')
    setError('')
    setSaving(true)
    try {
      const quote = await quotesService.create({
        customerId: client.id,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        items: items.map((i) => ({
          catalogItemId: i.catalogItemId,
          quantity: i.quantity.toFixed(3).replace(/\.?0+$/, ''),
          // Só envia o preço quando foi alterado; senão vale o preço atual do catálogo.
          ...(i.unitPrice !== i.basePrice ? { unitPrice: i.unitPrice.toFixed(2) } : {}),
        })),
      })
      setCreated(quote)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    return (
      <Card className="mx-auto mt-10 max-w-lg items-center gap-4 p-10 text-center">
        <CheckCircle2 className="text-success size-12" />
        <h1 className="text-2xl font-semibold">Orçamento {formatQuoteNumber(created.number)} gerado!</h1>
        <p className="text-muted-foreground text-sm">Total de {formatCurrency(created.total)} para {created.customer.name}.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => actions.viewPdf(created)}><Eye /> Visualizar PDF</Button>
          <Button variant="outline" onClick={() => actions.download(created)}><Download /> Baixar PDF</Button>
          <Button onClick={() => actions.shareWhatsapp(created)}><Send /> Compartilhar pelo WhatsApp</Button>
        </div>
        <Link to="/orcamentos" className="text-muted-foreground hover:text-foreground mt-2 text-sm underline-offset-4 hover:underline">
          Voltar para orçamentos
        </Link>
      </Card>
    )
  }

  return (
    <>
      <PageHeader title="Novo orçamento" description="Monte a proposta em poucos passos." />
      <div className="grid grid-cols-[1fr_320px] items-start gap-6">
        <div className="space-y-5">
          <SectionCard step={1} title="Cliente">
            {client ? (
              <div className="bg-accent flex items-center justify-between rounded-lg p-4">
                <div className="text-sm">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-muted-foreground">{[client.phone, client.email].filter(Boolean).join(' · ') || 'Sem contato cadastrado'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setClient(null)}>Trocar</Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input aria-label="Pesquisar cliente" placeholder="Pesquisar cliente existente..." className="pl-9" value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} />
                  {clientQuery.trim() && (
                    <ul className="bg-card absolute z-10 mt-1 w-full rounded-lg border shadow-lg">
                      {searchingClients && <li className="text-muted-foreground p-3 text-sm">Buscando...</li>}
                      {!searchingClients && clientMatches.length === 0 && <li className="text-muted-foreground p-3 text-sm">Nenhum cliente encontrado.</li>}
                      {!searchingClients && clientMatches.map((c) => (
                        <li key={c.id}>
                          <button type="button" className="hover:bg-accent w-full px-3 py-2 text-left text-sm" onClick={() => { setClient(c); setClientQuery(''); setError('') }}>
                            <span className="font-medium">{c.name}</span> <span className="text-muted-foreground">· {c.phone ?? c.email ?? 'sem contato'}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button variant="outline" onClick={() => setNewClientOpen(true)}><UserPlus /> Novo cliente</Button>
              </div>
            )}
          </SectionCard>

          <SectionCard step={2} title="Produtos e serviços">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input aria-label="Pesquisar no catálogo" placeholder="Pesquisar no catálogo..." className="pl-9" value={catalogQuery} onChange={(e) => setCatalogQuery(e.target.value)} />
              {catalogQuery.trim() && (
                <ul className="bg-card absolute z-10 mt-1 w-full rounded-lg border shadow-lg">
                  {searchingCatalog && <li className="text-muted-foreground p-3 text-sm">Buscando...</li>}
                  {!searchingCatalog && catalogMatches.length === 0 && <li className="text-muted-foreground p-3 text-sm">Nenhum item encontrado.</li>}
                  {!searchingCatalog && catalogMatches.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-muted-foreground text-xs">{p.description ? `${p.description} · ` : ''}{formatCurrency(p.basePrice)}/{unitLabel(p.unit)}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addItem(p)} aria-label={`Adicionar ${p.name}`}><Plus /> Adicionar item</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SectionCard>

          <SectionCard step={3} title="Itens do orçamento">
            {items.length === 0 ? (
              <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">Nenhum item adicionado ainda.</p>
            ) : (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH className="px-2">Item</TH><TH className="w-20 px-2">Qtd.</TH><TH className="px-2">Un.</TH><TH className="w-32 px-2">Valor unit.</TH><TH className="px-2 text-right">Subtotal</TH><TH className="w-10 px-2"><span className="sr-only">Remover</span></TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((i) => (
                    <TR key={i.key}>
                      <TD className="px-2"><p className="font-medium">{i.name}</p><p className="text-muted-foreground text-xs">{i.description}</p></TD>
                      <TD className="px-2"><Input type="number" min={0} step="any" aria-label={`Quantidade de ${i.name}`} value={i.quantity} onChange={(e) => patch(i.key, { quantity: Math.max(0, Number(e.target.value)) })} /></TD>
                      <TD className="text-muted-foreground px-2">{unitLabel(i.unit)}</TD>
                      <TD className="px-2"><Input type="number" min={0} step="0.01" aria-label={`Valor unitário de ${i.name}`} value={i.unitPrice} onChange={(e) => patch(i.key, { unitPrice: Math.max(0, Number(e.target.value)) })} /></TD>
                      <TD className="px-2 text-right font-medium">{formatCurrency(lineTotal(i.quantity, i.unitPrice))}</TD>
                      <TD className="px-2"><Button variant="ghost" size="icon" aria-label={`Remover ${i.name}`} onClick={() => setItems((s) => s.filter((x) => x.key !== i.key))}><Trash2 className="size-4" /></Button></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </SectionCard>

          <SectionCard step={4} title="Condições comerciais">
            <div className="text-muted-foreground bg-secondary/50 rounded-lg p-3 text-sm">
              <p>
                <strong className="text-foreground">Validade:</strong>{' '}
                {template.data ? `${template.data.validityDays} dias a partir da emissão` : '—'}
              </p>
              {template.data?.commercialTerms && (
                <p className="mt-1 whitespace-pre-line"><strong className="text-foreground">Condições:</strong> {template.data.commercialTerms}</p>
              )}
              <p className="mt-1 text-xs">Validade e condições saem do modelo de orçamento — ajuste em <Link to="/configuracoes" className="underline">Configurações</Link>.</p>
            </div>
            <Field label="Observações" htmlFor="notes">
              <Textarea id="notes" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Informações adicionais para o cliente" />
            </Field>
          </SectionCard>
        </div>

        <aside className="sticky top-0">
          <Card className="border-primary/40 gap-4 p-6">
            <div>
              <p className="text-muted-foreground text-xs">Orçamento</p>
              <p className="font-semibold">Numeração automática ao gerar</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Itens</dt><dd>{items.length}</dd></div>
              <div className="flex justify-between border-t pt-3 text-base font-semibold"><dt>Valor total</dt><dd data-testid="total">{formatCurrency(total)}</dd></div>
            </dl>
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <Button onClick={save} disabled={saving}>Gerar orçamento</Button>
          </Card>
        </aside>
      </div>
      <ClientFormModal open={newClientOpen} onOpenChange={setNewClientOpen} onSaved={(c) => { setClient(c); setError('') }} />
    </>
  )
}
