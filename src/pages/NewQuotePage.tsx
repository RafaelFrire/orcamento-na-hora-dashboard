import { AlertTriangle, CheckCircle2, Download, Eye, Plus, Search, Send, Trash2, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { ClientFormModal } from '@/components/shared/ClientFormModal'
import { PageHeader } from '@/components/shared/PageHeader'
import { SendQuoteModal } from '@/components/shared/SendQuoteModal'
import { AiBadge, AiDraftBox, type AiDraftMeta } from '@/features/ai-quote/AiDraftBox'
import { clearWork, dropCachedDraft, loadWork, saveWork, type QuoteDetails, type WorkItem } from '@/features/ai-quote/aiStorage'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Textarea } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { errorMessage, useApi, useDebounced } from '@/hooks/useApi'
import { useQuoteActions } from '@/hooks/useQuoteActions'
import { formatCurrency, formatQuoteNumber, lineTotal, unitLabel } from '@/lib/format'
import { aiService } from '@/services/ai'
import { catalogService } from '@/services/catalog'
import { customersService } from '@/services/customers'
import { quotesService } from '@/services/quotes'
import { templateService } from '@/services/template'
import type { AiDraftUnmatched, AiQuoteDraft, CatalogItem, ConversationCustomer, Quote } from '@/types'

type DraftItem = WorkItem

const EMPTY_DETAILS: QuoteDetails = { document: '', email: '', address: '', schedule: '' }
const DOCUMENT_WARNINGS: Record<string, string> = {
  DOCUMENT_INVALID: 'A IA encontrou um CPF/CNPJ, mas ele é inválido (dígitos errados ou faltando). Confira com o cliente.',
  DOCUMENT_NOT_IN_TEXT: 'A IA sugeriu um CPF/CNPJ que o cliente não informou; ele foi descartado.',
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
  const navState = useLocation().state as { customer?: ConversationCustomer; conversation?: { id: string; label: string; key: string } } | null
  const preset = navState?.customer ?? null
  // Rascunho de IA salvo neste navegador (se o dono saiu da página e voltou), para não gerar de novo.
  const restored = useMemo(() => {
    const w = loadWork()
    return w && (!navState?.conversation || w.conversationId === navState.conversation.id) ? w : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [client, setClient] = useState<ConversationCustomer | null>(restored?.client ?? preset)
  // --- Rascunho de IA: nada é salvo até o clique em "Gerar orçamento". ---
  const [recovered, setRecovered] = useState(!!restored)
  const [aiDraftId, setAiDraftId] = useState<string | null>(restored?.aiDraftId ?? null)
  const [aiMeta, setAiMeta] = useState({ signature: restored?.signature ?? '', text: restored?.text ?? '' })
  const [clientFromAi, setClientFromAi] = useState(restored?.clientFromAi ?? false)
  const [notesFromAi, setNotesFromAi] = useState(restored?.notesFromAi ?? false)
  const [unmatched, setUnmatched] = useState<AiDraftUnmatched[]>(restored?.unmatched ?? [])
  const [suggestedClient, setSuggestedClient] = useState<{ name: string; phone: string } | null>(restored?.suggestedClient ?? null)
  const [suggestionKey, setSuggestionKey] = useState(0)
  const [clientQuery, setClientQuery] = useState('')
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [catalogQuery, setCatalogQuery] = useState('')
  const [items, setItems] = useState<DraftItem[]>(restored?.items ?? [])
  const [notes, setNotes] = useState(restored?.notes ?? '')
  // Dados do cliente e do serviço (só deste orçamento): a IA preenche, o dono confere.
  const [details, setDetails] = useState<QuoteDetails>(restored?.details ?? EMPTY_DETAILS)
  const [detailsFromAi, setDetailsFromAi] = useState(restored?.detailsFromAi ?? false)
  const [detailsWarnings, setDetailsWarnings] = useState<string[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<Quote | null>(null)
  const [sending, setSending] = useState(false)

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

  // Guarda o trabalho com a IA no navegador a cada ajuste; some ao gerar o orçamento ou descartar.
  useEffect(() => {
    if (!aiDraftId || created) return
    saveWork({ signature: aiMeta.signature, aiDraftId, conversationId: navState?.conversation?.id ?? restored?.conversationId, text: aiMeta.text, client, clientFromAi, suggestedClient, items, unmatched, notes, notesFromAi, details, detailsFromAi })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiDraftId, aiMeta, client, clientFromAi, suggestedClient, items, unmatched, notes, notesFromAi, details, detailsFromAi, created])

  const editDetail = (field: keyof QuoteDetails, value: string) => {
    setDetails((d) => ({ ...d, [field]: value }))
    setDetailsFromAi(false)
  }

  const total = items.reduce((s, i) => s + lineTotal(i.quantity, i.unitPrice), 0)

  function addItem(p: CatalogItem) {
    const price = Number(p.basePrice)
    setItems((s) => [
      ...s,
      { key: `${p.id}-${Date.now()}-${s.length}`, catalogItemId: p.id, name: p.name, description: p.description ?? '', unit: p.unit, basePrice: price, quantity: p.defaultQuantity ? Number(p.defaultQuantity) : 1, unitPrice: price },
    ])
    setCatalogQuery('')
    setError('')
  }

  // Editar um campo equivale a conferi-lo: o selo da IA some.
  const patch = (key: string, p: Partial<DraftItem>) =>
    setItems((s) => s.map((i) => (i.key === key ? { ...i, ai: false, needsReview: false, ...(p.quantity !== undefined ? { qtyHint: undefined } : {}), ...p } : i)))

  async function applyDraft(draft: AiQuoteDraft, meta: AiDraftMeta) {
    const newDraftId = meta.aiDraftId
    // O servidor só devolve ids do catálogo; os preços vêm do catálogo (a IA nunca informa preço).
    const resolved = await Promise.all(
      draft.items.map(async (d) => {
        const found = (await catalogService.items({ q: d.name, active: true, pageSize: 10 })).data.find((c) => c.id === d.catalogItemId)
        return { d, found }
      }),
    )
    const lost: AiDraftUnmatched[] = resolved.filter((r) => !r.found).map((r) => ({ text: r.d.sourceText, reason: 'NO_CATALOG_MATCH', suggestions: [] }))
    const rows: DraftItem[] = resolved.flatMap(({ d, found }, n) =>
      found
        ? [{
            key: `${found.id}-ai-${Date.now()}-${n}`,
            catalogItemId: found.id,
            name: found.name,
            description: found.description ?? '',
            unit: found.unit,
            basePrice: Number(found.basePrice),
            quantity: d.quantity ? Number(d.quantity) : 0,
            unitPrice: Number(found.basePrice),
            ai: true,
            needsReview: d.confidence < 0.7,
            qtyHint: d.quantitySource === 'inferred' || d.quantitySource === 'default' ? d.quantitySource : undefined,
          }]
        : [],
    )

    // Um novo rascunho substitui o anterior (o antigo é descartado para a auditoria).
    if (aiDraftId && aiDraftId !== newDraftId) void aiService.discard(aiDraftId).catch(() => undefined)
    setAiDraftId(newDraftId)
    setAiMeta({ signature: meta.signature, text: meta.text })
    setRecovered(false)
    setItems(rows)
    setUnmatched([...draft.unmatched, ...lost])
    setNotes(draft.notes ?? '')
    setNotesFromAi(!!draft.notes)

    const found: QuoteDetails = {
      document: draft.customer.document ?? '',
      email: draft.customer.email ?? '',
      address: draft.serviceAddress ?? '',
      schedule: draft.schedule ?? '',
    }
    setDetails(found)
    setDetailsFromAi(Object.values(found).some(Boolean))
    setDetailsWarnings(draft.warnings.filter((w) => w in DOCUMENT_WARNINGS))

    const c = draft.customer
    setSuggestedClient(null)
    if (c.status === 'matched' && c.customerId && c.name) {
      setClient({ id: c.customerId, name: c.name, phone: c.phone, email: null })
      setClientFromAi(!preset || preset.id !== c.customerId)
    } else if (c.status === 'suggested_new' && c.name) {
      setSuggestedClient({ name: c.name, phone: c.phone ?? '' })
      setSuggestionKey((k) => k + 1)
    }
    setError('')
  }

  /** Descarta o rascunho da IA (no servidor e no navegador) e volta ao preenchimento manual. */
  function discardAi() {
    if (aiDraftId) void aiService.discard(aiDraftId).catch(() => undefined)
    clearWork()
    if (aiMeta.signature) dropCachedDraft(aiMeta.signature)
    setAiDraftId(null)
    setAiMeta({ signature: '', text: '' })
    setItems([])
    setUnmatched([])
    setNotes('')
    setNotesFromAi(false)
    setDetails(EMPTY_DETAILS)
    setDetailsFromAi(false)
    setDetailsWarnings([])
    setClientFromAi(false)
    setSuggestedClient(null)
    setError('')
  }

  async function save() {
    if (!client) return setError('Selecione um cliente para continuar.')
    if (items.length === 0) return setError('Adicione ao menos um item ao orçamento.')
    if (items.some((i) => !(i.quantity > 0))) return setError('A quantidade de cada item deve ser maior que zero.')
    if (unmatched.length > 0) return setError('Resolva ou descarte os itens que a IA não encontrou no catálogo.')
    if (items.some((i) => i.needsReview)) return setError('Confirme os itens marcados como baixa confiança da IA.')
    setError('')
    setSaving(true)
    try {
      const quote = await quotesService.create({
        customerId: client.id,
        ...(aiDraftId ? { aiDraftId } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(details.document.trim() ? { customerDocument: details.document.trim() } : {}),
        ...(details.email.trim() ? { customerEmail: details.email.trim() } : {}),
        ...(details.address.trim() ? { serviceAddress: details.address.trim() } : {}),
        ...(details.schedule.trim() ? { scheduledFor: details.schedule.trim() } : {}),
        items: items.map((i) => ({
          catalogItemId: i.catalogItemId,
          quantity: i.quantity.toFixed(3).replace(/\.?0+$/, ''),
          // Só envia o preço quando foi alterado; senão vale o preço atual do catálogo.
          ...(i.unitPrice !== i.basePrice ? { unitPrice: i.unitPrice.toFixed(2) } : {}),
        })),
      })
      setCreated(quote)
      // O rascunho virou orçamento: limpa o que ficou salvo no navegador.
      clearWork()
      if (aiMeta.signature) dropCachedDraft(aiMeta.signature)
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
          <Button onClick={() => setSending(true)}><Send /> Enviar ao cliente</Button>
        </div>
        <Link to="/orcamentos" className="text-muted-foreground hover:text-foreground mt-2 text-sm underline-offset-4 hover:underline">
          Voltar para orçamentos
        </Link>
        <SendQuoteModal quote={sending ? created : null} onClose={() => setSending(false)} />
      </Card>
    )
  }

  return (
    <>
      <PageHeader title="Novo orçamento" description="Monte a proposta em poucos passos." />
      <div className="grid grid-cols-[1fr_320px] items-start gap-6">
        <div className="space-y-5">
          <AiDraftBox
            conversation={navState?.conversation}
            initialText={restored?.text ?? ''}
            customerId={client?.id}
            autoRun={!!navState?.conversation && !restored}
            onDraft={applyDraft}
          />
          {aiDraftId && (
            <div role="status" className="text-muted-foreground flex items-center justify-between rounded-lg border border-dashed px-4 py-2 text-xs">
              <span>{recovered ? 'Rascunho da IA recuperado do navegador.' : 'Rascunho da IA salvo neste navegador: se você sair da página, ele é mantido.'}</span>
              <Button size="sm" variant="ghost" onClick={discardAi}>Descartar rascunho</Button>
            </div>
          )}

          <SectionCard step={1} title="Cliente">
            {client ? (
              <div className="bg-accent flex items-center justify-between rounded-lg p-4">
                <div className="text-sm">
                  <p className="flex items-center gap-2 font-medium">{client.name}{clientFromAi && <AiBadge />}</p>
                  <p className="text-muted-foreground">{[client.phone, client.email].filter(Boolean).join(' · ') || 'Sem contato cadastrado'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setClient(null); setClientFromAi(false) }}>Trocar</Button>
              </div>
            ) : (
              <>
              {suggestedClient && (
                <div className="bg-warning/15 mb-3 flex items-center justify-between gap-3 rounded-lg p-3 text-sm">
                  <span className="flex items-center gap-2"><AiBadge /> A IA identificou um cliente novo: <strong>{suggestedClient.name}</strong></span>
                  <Button size="sm" variant="outline" onClick={() => setNewClientOpen(true)}><UserPlus /> Cadastrar cliente</Button>
                </div>
              )}
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
              </>
            )}

            <div className="space-y-3 border-t pt-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                Dados do cliente e do serviço {detailsFromAi && <AiBadge />}
                <span className="text-muted-foreground text-xs font-normal">· valem só para este orçamento, o cadastro não muda</span>
              </p>
              {detailsWarnings.map((w) => (
                <p key={w} role="alert" className="bg-warning/15 flex items-center gap-2 rounded-lg p-2 text-xs"><AlertTriangle className="size-3.5 shrink-0" /> {DOCUMENT_WARNINGS[w]}</p>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF/CNPJ" htmlFor="q-document">
                  <Input id="q-document" inputMode="numeric" maxLength={30} placeholder="000.000.000-00" value={details.document} onChange={(e) => editDetail('document', e.target.value)} />
                </Field>
                <Field label="E-mail" htmlFor="q-email">
                  <Input id="q-email" type="email" maxLength={160} placeholder={client?.email ?? 'cliente@email.com'} value={details.email} onChange={(e) => editDetail('email', e.target.value)} />
                </Field>
              </div>
              <Field label="Endereço do serviço" htmlFor="q-address">
                <Input id="q-address" maxLength={300} placeholder="Rua, número, complemento, bairro, cidade" value={details.address} onChange={(e) => editDetail('address', e.target.value)} />
              </Field>
              <Field label="Data e horário combinados" htmlFor="q-schedule">
                <Input id="q-schedule" maxLength={120} placeholder="Ex.: sábado, dia 5, às 9h" value={details.schedule} onChange={(e) => editDetail('schedule', e.target.value)} />
              </Field>
            </div>
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
            {unmatched.length > 0 && (
              <div role="region" aria-label="Pendências da IA" className="bg-warning/15 space-y-2 rounded-lg p-3 text-sm">
                <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" /> A IA não encontrou estes itens no catálogo</p>
                <ul className="space-y-1">
                  {unmatched.map((u, n) => (
                    <li key={`${u.text}-${n}`} className="flex items-center justify-between gap-3">
                      <span>“{u.text}”</span>
                      <span className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setCatalogQuery(u.text)}>Buscar no catálogo</Button>
                        <Button size="sm" variant="ghost" onClick={() => setUnmatched((s) => s.filter((_, k) => k !== n))}>Descartar</Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                    <TR key={i.key} className={i.needsReview ? 'bg-warning/15' : undefined}>
                      <TD className="px-2">
                        <p className="flex flex-wrap items-center gap-2 font-medium">{i.name}{i.ai && <AiBadge />}</p>
                        <p className="text-muted-foreground text-xs">{i.description}</p>
                        {i.needsReview && (
                          <p className="mt-1 flex items-center gap-2 text-xs">
                            <AlertTriangle className="size-3" /> Baixa confiança — confira este item.
                            <Button size="sm" variant="outline" aria-label={`Confirmar ${i.name}`} onClick={() => setItems((s) => s.map((x) => (x.key === i.key ? { ...x, needsReview: false } : x)))}>Confirmar</Button>
                          </p>
                        )}
                        {i.ai && i.quantity === 0 && <p className="text-destructive mt-1 text-xs">O pedido não informou a quantidade.</p>}
                      </TD>
                      <TD className="px-2">
                        <Input type="number" min={0} step="any" aria-label={`Quantidade de ${i.name}`} value={i.quantity} onChange={(e) => patch(i.key, { quantity: Math.max(0, Number(e.target.value)) })} />
                        {i.qtyHint && <p className="text-muted-foreground mt-1 text-xs">{i.qtyHint === 'inferred' ? 'Mesma duração do pedido' : 'Padrão do item'}</p>}
                      </TD>
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
            <Field label={notesFromAi ? "Observações (sugerido pela IA)" : "Observações"} htmlFor="notes">
              <Textarea id="notes" maxLength={2000} value={notes} onChange={(e) => { setNotes(e.target.value); setNotesFromAi(false) }} placeholder="Informações adicionais para o cliente" />
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
      <ClientFormModal key={suggestionKey} initial={suggestedClient ?? undefined} open={newClientOpen} onOpenChange={setNewClientOpen} onSaved={(c) => { setClient(c); setSuggestedClient(null); setClientFromAi(false); setError('') }} />
    </>
  )
}
