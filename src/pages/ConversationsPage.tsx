import { MessagesSquare, Paperclip, Search, Send, Sparkles, UserPlus, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { MessageMedia } from '@/components/shared/MessageMedia'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { errorMessage, useApi, useDebounced } from '@/hooks/useApi'
import { ATTACHMENT_ACCEPT, formatFileSize, validateAttachment } from '@/lib/attachments'
import { formatCurrency, formatMessageTime, formatQuoteNumber, initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { customersService } from '@/services/customers'
import { quotesService } from '@/services/quotes'
import { whatsappService } from '@/services/whatsapp'
import type { Conversation, Message } from '@/types'

const displayName = (c: Conversation) => c.customer?.name ?? c.contactName ?? `+${c.waContactId}`

/** Legenda do anexo: tira o rótulo automático ("[Imagem] ...") e o nome do arquivo repetido. */
function captionOf(m: Message) {
  const body = (m.body ?? '').replace(/^\[[^\]]+\]\s*/, '').trim()
  return body && body !== m.mediaName ? body : ''
}

const statusLabel: Record<Message['status'], string> = {
  RECEIVED: '',
  SENT: 'Enviada',
  DELIVERED: 'Entregue',
  READ: 'Lida',
  FAILED: 'Falhou',
}

function MessagePane({ conversation, onChanged }: { conversation: Conversation; onChanged: () => void }) {
  const messages = useApi(() => whatsappService.messages(conversation.id, { limit: 100 }), [conversation.id], { pollMs: 5000 })
  const [older, setOlder] = useState<Message[]>([])
  const [olderHasMore, setOlderHasMore] = useState<boolean | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const bottom = useRef<HTMLDivElement>(null)

  const list = [...older, ...(messages.data?.data ?? [])]
  const hasMore = olderHasMore ?? messages.data?.hasMore ?? false

  // Abrir a conversa (ou receber mensagem com ela aberta) zera as não lidas.
  const { id, unreadCount } = conversation
  useEffect(() => {
    if (unreadCount > 0) whatsappService.markRead(id).then(onChanged).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, unreadCount])

  // Últimas mensagens recebidas (até 4000 caracteres, o limite da IA).
  const inboundText = list.filter((m) => m.direction === 'IN' && m.type === 'text' && m.body).map((m) => m.body).join('\n').slice(-4000)
  const lastId = list[list.length - 1]?.id
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [lastId])

  async function loadOlder() {
    const first = list[0]
    if (!first) return
    try {
      const res = await whatsappService.messages(id, { limit: 100, before: first.sentAt })
      setOlder((s) => [...res.data, ...s])
      setOlderHasMore(res.hasMore)
    } catch (e) {
      setSendError(errorMessage(e))
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if ((!body && !file) || sending) return
    setSending(true)
    setSendError('')
    try {
      if (file) await whatsappService.sendAttachment(id, file, body)
      else await whatsappService.send(id, body)
      setText('')
      setFile(null)
      messages.reload()
      onChanged()
    } catch (err) {
      setSendError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    const problem = validateAttachment(picked)
    setSendError(problem)
    setFile(problem ? null : picked)
  }

  return (
    <section aria-label="Mensagens" className="bg-background flex min-h-0 flex-col">
      <div className="bg-card flex items-center justify-between gap-3 border-b px-5 py-3 font-medium">
        <span className="truncate">{displayName(conversation)}</span>
        {/* Pedido do cliente (mensagens recebidas) vira rascunho de orçamento com IA. */}
        {inboundText && (
          <Button asChild size="sm" variant="outline"><Link to="/orcamentos/novo" state={{ customer: conversation.customer, aiText: inboundText }}><Sparkles /> Criar com IA</Link></Button>
        )}
        {/* Em telas estreitas o painel do cliente fica oculto: o atalho principal vem para o cabeçalho. */}
        {conversation.customer && (
          <Button asChild size="sm" className="xl:hidden"><Link to="/orcamentos/novo" state={{ customer: conversation.customer }}>Gerar orçamento</Link></Button>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-5">
        {messages.error && <ErrorNotice message={messages.error} onRetry={messages.reload} />}
        {messages.loading && !messages.data && <TableSkeleton rows={4} />}
        {hasMore && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={loadOlder}>Carregar mensagens anteriores</Button>
          </div>
        )}
        {list.map((m) => (
          <div key={m.id} className={cn('flex', m.direction === 'OUT' && 'justify-end')}>
            <div className={cn('max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm', m.direction === 'OUT' ? 'bg-gold-soft/70 rounded-br-sm' : 'bg-card rounded-bl-sm')}>
              {m.hasMedia && <MessageMedia conversationId={id} message={m} />}
              {(m.hasMedia ? captionOf(m) : m.body) && <span className="break-words whitespace-pre-wrap">{m.hasMedia ? captionOf(m) : m.body}</span>}
              <span className="text-muted-foreground mt-0.5 block text-right text-[10px]">
                {formatMessageTime(m.sentAt)}
                {m.direction === 'OUT' && statusLabel[m.status] && ` · ${statusLabel[m.status]}`}
              </span>
              {m.status === 'FAILED' && m.errorMessage && <span className="text-destructive block text-[10px]">{m.errorMessage}</span>}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {sendError && <p role="alert" className="text-destructive bg-card border-t px-4 pt-2 text-xs">{sendError}</p>}
      {file && (
        <div className="bg-card flex items-center gap-2 border-t px-4 pt-3 text-xs">
          <Paperclip className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
          <span className="text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
          <Button type="button" variant="ghost" size="icon" aria-label="Remover anexo" onClick={() => setFile(null)}><X className="size-4" /></Button>
        </div>
      )}
      <form onSubmit={send} className="bg-card flex items-center gap-2 border-t p-3">
        <input ref={fileInput} type="file" accept={ATTACHMENT_ACCEPT} className="hidden" aria-label="Selecionar arquivo" onChange={pickFile} />
        <Button type="button" variant="ghost" size="icon" aria-label="Anexar arquivo" disabled={sending} onClick={() => fileInput.current?.click()}><Paperclip className="size-4" /></Button>
        <Input aria-label="Mensagem" placeholder={file ? 'Legenda (opcional)' : 'Digite uma mensagem'} value={text} maxLength={file ? 1024 : 4096} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" size="icon" aria-label="Enviar" disabled={sending || (!text.trim() && !file)}><Send className="size-4" /></Button>
      </form>
    </section>
  )
}

function CustomerPanel({ conversation, onChanged }: { conversation: Conversation; onChanged: () => void }) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const q = useDebounced(query.trim())
  const customer = conversation.customer
  const matches = useApi(() => (q && !customer ? customersService.list({ q, pageSize: 5 }) : Promise.resolve(null)), [q, customer?.id])
  const quotes = useApi(
    () => (customer ? quotesService.list({ customerId: customer.id, pageSize: 5 }) : Promise.resolve(null)),
    [customer?.id],
  )

  async function run(action: () => Promise<unknown>, done: string) {
    try {
      await action()
      toast(done)
      setQuery('')
      onChanged()
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  return (
    <aside aria-label="Informações do cliente" className="hidden min-h-0 space-y-4 overflow-y-auto border-l p-5 text-sm xl:block">
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar className="size-14"><AvatarFallback className="bg-secondary">{initials(displayName(conversation))}</AvatarFallback></Avatar>
        <p className="font-semibold">{displayName(conversation)}</p>
        <p className="text-muted-foreground text-xs">+{conversation.waContactId}</p>
      </div>

      {customer ? (
        <>
          <div className="text-muted-foreground space-y-1"><p>{customer.phone ?? '—'}</p><p>{customer.email ?? '—'}</p></div>
          <div>
            <p className="mb-2 font-medium">Orçamentos</p>
            {quotes.data && quotes.data.data.length === 0 && <p className="text-muted-foreground text-xs">Nenhum orçamento ainda.</p>}
            <ul className="text-muted-foreground space-y-1 text-xs">
              {quotes.data?.data.map((qt) => (
                <li key={qt.id} className="flex justify-between"><span>{formatQuoteNumber(qt.number)}</span><span>{formatCurrency(qt.total)}</span></li>
              ))}
            </ul>
          </div>
          <Button asChild className="w-full"><Link to="/orcamentos/novo" state={{ customer }}>Gerar orçamento</Link></Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={() => run(() => whatsappService.link(conversation.id, null), 'Cliente desvinculado.')}>Desvincular cliente</Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">Esta conversa ainda não está associada a um cliente.</p>
          <Button variant="outline" className="w-full" onClick={() => run(() => whatsappService.createCustomer(conversation.id), 'Cliente cadastrado e vinculado.')}>
            <UserPlus /> Cadastrar como cliente
          </Button>
          <div>
            <p className="mb-2 font-medium">Vincular a cliente existente</p>
            <Input aria-label="Buscar cliente para vincular" placeholder="Nome, e-mail ou telefone" value={query} onChange={(e) => setQuery(e.target.value)} />
            {q && (
              <ul className="mt-1 rounded-lg border">
                {matches.data && matches.data.data.length === 0 && <li className="text-muted-foreground p-2 text-xs">Nenhum cliente encontrado.</li>}
                {matches.data?.data.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="hover:bg-accent w-full px-3 py-2 text-left text-xs" onClick={() => run(() => whatsappService.link(conversation.id, c.id), `Vinculado a ${c.name}.`)}>
                      <span className="font-medium">{c.name}</span> <span className="text-muted-foreground">· {c.phone ?? c.email ?? 'sem contato'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </aside>
  )
}

export default function ConversationsPage() {
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const q = useDebounced(search.trim())
  const conversations = useApi(() => whatsappService.conversations({ pageSize: 50, q }), [q], { pollMs: 8000 })

  const list = conversations.data?.data ?? []
  const active = list.find((c) => c.id === activeId) ?? (q ? null : list[0] ?? null)

  return (
    <>
      <PageHeader title="Conversas" description="Atendimento centralizado das conversas do seu WhatsApp Business" />

      <div className="bg-card grid h-[calc(100vh-13rem)] min-h-[480px] grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px] overflow-hidden rounded-xl border">
        <section aria-label="Lista de conversas" className="flex min-h-0 flex-col border-r">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input aria-label="Buscar conversa" placeholder="Buscar conversa" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {conversations.error && <li><ErrorNotice message={conversations.error} onRetry={conversations.reload} /></li>}
            {conversations.loading && !conversations.data && <li><TableSkeleton rows={5} /></li>}
            {list.map((c) => (
              <li key={c.id}>
                <button type="button" aria-current={active?.id === c.id ? 'true' : undefined} onClick={() => setActiveId(c.id)} className={cn('hover:bg-accent/60 flex w-full items-center gap-3 p-3 text-left', c.id === active?.id && 'bg-accent')}>
                  <Avatar><AvatarFallback className="bg-secondary text-xs">{initials(displayName(c))}</AvatarFallback></Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2 text-sm font-medium"><span className="truncate">{displayName(c)}</span><span className="text-muted-foreground shrink-0 text-xs font-normal">{formatMessageTime(c.lastMessageAt)}</span></span>
                    <span className="text-muted-foreground block truncate text-xs">{c.lastMessageText}</span>
                  </span>
                  {c.unreadCount > 0 && <span aria-label={`${c.unreadCount} não lidas`} className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">{c.unreadCount}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {active ? (
          <>
            <MessagePane key={active.id} conversation={active} onChanged={conversations.reload} />
            <CustomerPanel key={`${active.id}:${active.customer?.id ?? ''}`} conversation={active} onChanged={conversations.reload} />
          </>
        ) : (
          <div className="col-span-2">
            {!conversations.loading && !conversations.error && (
              <EmptyState
                icon={MessagesSquare}
                title={q ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                description={q ? 'Tente outro nome ou telefone.' : 'As mensagens recebidas no WhatsApp conectado aparecem aqui.'}
                action={!q && <Button asChild variant="outline"><Link to="/whatsapp">Configurar WhatsApp</Link></Button>}
              />
            )}
          </div>
        )}
      </div>
    </>
  )
}
