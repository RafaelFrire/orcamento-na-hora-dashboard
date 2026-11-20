import { CheckCircle2, Download, Eye, Plus, Search, Send, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ClientFormModal } from '@/components/shared/ClientFormModal'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Select, Textarea } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, quoteSubtotal, quoteTotal } from '@/lib/format'
import { db, nextQuoteNumber } from '@/mocks/store'
import type { CatalogItem, Client, Quote, QuoteItem } from '@/types'

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
  const toast = useToast()
  const [number] = useState(nextQuoteNumber)
  const [client, setClient] = useState<Client | null>(null)
  const [clientQuery, setClientQuery] = useState('')
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [catalogQuery, setCatalogQuery] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [validity, setValidity] = useState('15')
  const [payment, setPayment] = useState('À vista')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  const clientMatches = clientQuery.trim()
    ? db.clients.filter((c) => c.name.toLowerCase().includes(clientQuery.toLowerCase()))
    : []
  const catalogMatches = db.catalog.filter(
    (p) => p.active && catalogQuery.trim() && p.name.toLowerCase().includes(catalogQuery.toLowerCase()),
  )

  const draft: Pick<Quote, 'items' | 'discount'> = { items, discount }
  const subtotal = quoteSubtotal(draft)
  const total = quoteTotal(draft)

  function addItem(p: CatalogItem) {
    setItems((s) => [
      ...s,
      { id: `i${Date.now()}${s.length}`, catalogId: p.id, name: p.name, description: p.description, unit: p.unit, quantity: 1, unitPrice: p.price },
    ])
    setCatalogQuery('')
    setError('')
  }

  const patch = (id: string, p: Partial<QuoteItem>) =>
    setItems((s) => s.map((i) => (i.id === id ? { ...i, ...p } : i)))

  function save(status: 'draft' | 'pending') {
    if (!client) return setError('Selecione um cliente para continuar.')
    if (items.length === 0) return setError('Adicione ao menos um item ao orçamento.')
    setError('')
    db.quotes.unshift({
      id: `q${Date.now()}`, number, clientId: client.id, createdAt: '2026-11-19',
      validUntil: '2026-12-04', status, items, discount, paymentTerms: payment, notes,
    })
    if (status === 'draft') toast('Rascunho salvo com sucesso.')
    else setGenerated(true)
  }

  if (generated) {
    return (
      <Card className="mx-auto mt-10 max-w-lg items-center gap-4 p-10 text-center">
        <CheckCircle2 className="text-success size-12" />
        <h1 className="text-2xl font-semibold">Orçamento {number} gerado!</h1>
        <p className="text-muted-foreground text-sm">Total de {formatCurrency(total)} para {client?.name}.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast('Abrindo visualização do PDF.')}><Eye /> Visualizar PDF</Button>
          <Button variant="outline" onClick={() => toast('PDF baixado.')}><Download /> Baixar PDF</Button>
          <Button onClick={() => toast('Abrindo o WhatsApp para compartilhar.')}><Send /> Compartilhar pelo WhatsApp</Button>
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
                  <p className="text-muted-foreground">{client.phone} · {client.email}</p>
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
                      {clientMatches.length === 0 && <li className="text-muted-foreground p-3 text-sm">Nenhum cliente encontrado.</li>}
                      {clientMatches.map((c) => (
                        <li key={c.id}>
                          <button type="button" className="hover:bg-accent w-full px-3 py-2 text-left text-sm" onClick={() => { setClient(c); setClientQuery(''); setError('') }}>
                            <span className="font-medium">{c.name}</span> <span className="text-muted-foreground">· {c.phone}</span>
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
                  {catalogMatches.length === 0 && <li className="text-muted-foreground p-3 text-sm">Nenhum item encontrado.</li>}
                  {catalogMatches.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-muted-foreground text-xs">{p.description} · {formatCurrency(p.price)}/{p.unit}</p>
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
                    <TR key={i.id}>
                      <TD className="px-2"><p className="font-medium">{i.name}</p><p className="text-muted-foreground text-xs">{i.description}</p></TD>
                      <TD className="px-2"><Input type="number" min={1} aria-label={`Quantidade de ${i.name}`} value={i.quantity} onChange={(e) => patch(i.id, { quantity: Math.max(0, Number(e.target.value)) })} /></TD>
                      <TD className="text-muted-foreground px-2">{i.unit}</TD>
                      <TD className="px-2"><Input type="number" min={0} step="0.01" aria-label={`Valor unitário de ${i.name}`} value={i.unitPrice} onChange={(e) => patch(i.id, { unitPrice: Math.max(0, Number(e.target.value)) })} /></TD>
                      <TD className="px-2 text-right font-medium">{formatCurrency(i.quantity * i.unitPrice)}</TD>
                      <TD className="px-2"><Button variant="ghost" size="icon" aria-label={`Remover ${i.name}`} onClick={() => setItems((s) => s.filter((x) => x.id !== i.id))}><Trash2 className="size-4" /></Button></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </SectionCard>

          <SectionCard step={4} title="Condições comerciais">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Validade" htmlFor="validity">
                <Select id="validity" value={validity} onChange={(e) => setValidity(e.target.value)}>
                  <option value="7">7 dias</option><option value="15">15 dias</option><option value="30">30 dias</option>
                </Select>
              </Field>
              <Field label="Condições de pagamento" htmlFor="payment">
                <Select id="payment" value={payment} onChange={(e) => setPayment(e.target.value)}>
                  <option>À vista</option><option>50% entrada + 50% entrega</option><option>3x sem juros</option>
                </Select>
              </Field>
              <Field label="Desconto (R$)" htmlFor="discount">
                <Input id="discount" type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} />
              </Field>
            </div>
            <Field label="Observações" htmlFor="notes">
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Informações adicionais para o cliente" />
            </Field>
          </SectionCard>
        </div>

        <aside className="sticky top-0">
          <Card className="border-primary/40 gap-4 p-6">
            <div>
              <p className="text-muted-foreground text-xs">Orçamento</p>
              <p className="font-semibold">{number}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Desconto</dt><dd>- {formatCurrency(Math.min(discount, subtotal))}</dd></div>
              <div className="flex justify-between border-t pt-3 text-base font-semibold"><dt>Valor total</dt><dd data-testid="total">{formatCurrency(total)}</dd></div>
            </dl>
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <Button onClick={() => save('pending')}>Gerar orçamento</Button>
            <Button variant="outline" onClick={() => save('draft')}>Salvar como rascunho</Button>
          </Card>
        </aside>
      </div>
      <ClientFormModal open={newClientOpen} onOpenChange={setNewClientOpen} onSaved={(c) => { setClient(c); setError('') }} />
    </>
  )
}
