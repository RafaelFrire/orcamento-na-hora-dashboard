import { Paperclip, Search, Send, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, quoteTotal } from '@/lib/format'
import { cn } from '@/lib/utils'
import { conversations as seed } from '@/mocks/data'
import { clientQuotes, getClient } from '@/mocks/store'
import type { Conversation } from '@/types'

const initials = (n: string) => n.split(' ').map((p) => p[0]).slice(0, 2).join('')

export default function ConversationsPage() {
  const [convs, setConvs] = useState<Conversation[]>(seed)
  const [activeId, setActiveId] = useState(seed[0].id)
  const [search, setSearch] = useState('')
  const [text, setText] = useState('')

  const active = convs.find((c) => c.id === activeId)!
  const client = getClient(active.clientId)!
  const list = convs.filter((c) => getClient(c.clientId)?.name.toLowerCase().includes(search.toLowerCase()))

  function send(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setConvs((s) =>
      s.map((c) =>
        c.id === activeId
          ? { ...c, lastMessage: text, messages: [...c.messages, { id: `m${Date.now()}`, from: 'me', text, time: 'agora' }] }
          : c,
      ),
    )
    setText('')
  }

  return (
    <>
      <PageHeader title="Conversas" description="Atendimento centralizado dos seus clientes" />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-dashed border-primary/60 bg-accent px-4 py-3 text-sm">
        <Sparkles className="text-primary size-4" />
        <span><strong>Módulo futuro:</strong> prévia ilustrativa com dados de exemplo. Esta funcionalidade ainda não está disponível no MVP.</span>
      </div>

      <div className="bg-card grid h-[calc(100vh-17rem)] min-h-[480px] grid-cols-[300px_1fr_300px] overflow-hidden rounded-xl border">
        <section aria-label="Lista de conversas" className="flex flex-col border-r">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input aria-label="Buscar conversa" placeholder="Buscar conversa" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {list.map((c) => {
              const cl = getClient(c.clientId)!
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => setActiveId(c.id)} className={cn('hover:bg-accent/60 flex w-full items-center gap-3 p-3 text-left', c.id === activeId && 'bg-accent')}>
                    <Avatar><AvatarFallback className="bg-secondary text-xs">{initials(cl.name)}</AvatarFallback></Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between text-sm font-medium"><span>{cl.name}</span><span className="text-muted-foreground text-xs font-normal">{c.time}</span></span>
                      <span className="text-muted-foreground block truncate text-xs">{c.lastMessage}</span>
                    </span>
                    {c.unread > 0 && <span aria-label={`${c.unread} não lidas`} className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-xs font-semibold">{c.unread}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-label="Mensagens" className="bg-background flex flex-col">
          <div className="bg-card border-b px-5 py-3 font-medium">{client.name}</div>
          <div className="flex-1 space-y-2 overflow-y-auto p-5">
            {active.messages.map((m) => (
              <div key={m.id} className={cn('flex', m.from === 'me' && 'justify-end')}>
                <div className={cn('max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm', m.from === 'me' ? 'bg-gold-soft/70 rounded-br-sm' : 'bg-card rounded-bl-sm')}>
                  {m.text}
                  <span className="text-muted-foreground ml-2 text-[10px]">{m.time}</span>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="bg-card flex items-center gap-2 border-t p-3">
            <Button type="button" variant="ghost" size="icon" aria-label="Anexar arquivo"><Paperclip className="size-4" /></Button>
            <Input aria-label="Mensagem" placeholder="Digite uma mensagem" value={text} onChange={(e) => setText(e.target.value)} />
            <Button type="submit" size="icon" aria-label="Enviar"><Send className="size-4" /></Button>
          </form>
        </section>

        <aside aria-label="Informações do cliente" className="space-y-4 border-l p-5 text-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <Avatar className="size-14"><AvatarFallback className="bg-secondary">{initials(client.name)}</AvatarFallback></Avatar>
            <p className="font-semibold">{client.name}</p>
          </div>
          <div className="text-muted-foreground space-y-1"><p>{client.phone}</p><p>{client.email}</p></div>
          <div>
            <p className="mb-2 font-medium">Orçamentos</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              {clientQuotes(client.id).map((q) => <li key={q.id} className="flex justify-between"><span>{q.number}</span><span>{formatCurrency(quoteTotal(q))}</span></li>)}
            </ul>
          </div>
          <Button asChild className="w-full"><Link to="/orcamentos/novo">Gerar orçamento</Link></Button>
        </aside>
      </div>
    </>
  )
}
