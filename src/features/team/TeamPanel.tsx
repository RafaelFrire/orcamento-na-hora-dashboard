import { Link2, Loader2, Plus, RefreshCw, UserMinus, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ErrorNotice } from '@/components/shared/Pager'
import { TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Field, Textarea } from '@/components/ui/form'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { errorMessage, useApi } from '@/hooks/useApi'
import { teamService, type InviteResult, type TeamMember } from '@/services/team'

import { CopyLinkBox } from './CopyLinkBox'
import { InviteDialog } from './InviteDialog'
import { formatDate, hoursLeft, roleLabel, ticketLabel } from './labels'

function StatusBadge({ m }: { m: TeamMember }) {
  if (m.status === 'DISABLED') return <Badge variant="outline">Desativado</Badge>
  if (m.removalRequested) return <Badge variant="secondary">Remoção solicitada</Badge>
  return <Badge variant="secondary">Ativo</Badge>
}

/** Aba "Equipe" do proprietário: tabela, vagas, convites por link e chamados. */
export function TeamPanel() {
  const toast = useToast()
  const { user } = useAuth()
  const team = useApi(() => teamService.get(), [])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [link, setLink] = useState<InviteResult | null>(null)
  const [ticketFor, setTicketFor] = useState<TeamMember | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  if (team.error) return <ErrorNotice message={team.error} onRetry={team.reload} />
  if (!team.data) return <TableSkeleton rows={4} />
  const { members, invitations, tickets, seats, plan } = team.data
  const full = seats.used >= seats.limit

  async function run(key: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(key)
    try {
      await fn()
      if (ok) toast(ok)
      team.reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  async function openTicket() {
    if (!ticketFor) return
    const target = ticketFor
    await run(
      `t-${target.userId}`,
      () => teamService.openTicket({ type: target.status === 'DISABLED' ? 'REACTIVATE_MEMBER' : 'REMOVE_MEMBER', targetUserId: target.userId, message: message.trim() || undefined }),
      'Chamado aberto. Nosso time vai atender em breve.',
    )
    setTicketFor(null)
    setMessage('')
  }

  const openTickets = tickets.filter((t) => t.status === 'OPEN')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Equipe</h2>
          <p className="text-muted-foreground text-sm">
            <span data-testid="seat-meter">
              {seats.active} ativo(s){seats.pending > 0 ? ` + ${seats.pending} convite(s) pendente(s)` : ''} de {seats.limit} usuário(s)
            </span>{' '}
            no plano {plan.label}.
          </p>
        </div>
        {seats.limit > 1 && (
          <Button onClick={() => setInviteOpen(true)} disabled={full || plan.expired}>
            <Plus className="size-4" /> Convidar funcionário
          </Button>
        )}
      </div>

      {seats.limit <= 1 ? (
        <p className="bg-accent rounded-md px-3 py-2 text-sm">
          O plano {plan.label} inclui apenas o proprietário.{' '}
          <Link to="/planos" className="font-medium underline underline-offset-4">Ver planos</Link> para liberar mais usuários.
        </p>
      ) : full ? (
        <p className="bg-accent rounded-md px-3 py-2 text-sm">
          Todas as vagas do plano estão ocupadas.{' '}
          <Link to="/planos" className="font-medium underline underline-offset-4">Ver planos</Link> para liberar mais.
        </p>
      ) : null}

      <Table aria-label="Membros da equipe">
        <THead>
          <TR>
            <TH>Nome</TH>
            <TH>Função</TH>
            <TH>Status</TH>
            <TH>Último acesso</TH>
            <TH className="text-right">Ações</TH>
          </TR>
        </THead>
        <TBody>
          {members.map((m) => (
            <TR key={m.userId}>
              <TD>
                <p className="font-medium">{m.name}</p>
                <p className="text-muted-foreground text-xs">{m.email}</p>
              </TD>
              <TD>{roleLabel[m.role]}</TD>
              <TD><StatusBadge m={m} /></TD>
              <TD>{formatDate(m.lastAccessAt)}</TD>
              <TD className="text-right">
                {m.userId !== user?.id && m.role !== 'OWNER' && !m.removalRequested && (
                  <Button variant="ghost" size="sm" onClick={() => setTicketFor(m)} disabled={busy === `t-${m.userId}`}>
                    <UserMinus className="size-4" /> {m.status === 'DISABLED' ? 'Solicitar reativação' : 'Solicitar remoção'}
                  </Button>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      {invitations.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Convites pendentes</h3>
          <Table aria-label="Convites pendentes">
            <TBody>
              {invitations.map((i) => (
                <TR key={i.id}>
                  <TD>
                    <p className="font-medium">{i.name}</p>
                    <p className="text-muted-foreground text-xs">{i.email}</p>
                  </TD>
                  <TD><Badge variant="outline">Convite pendente · expira em {hoursLeft(i.expiresAt)}</Badge></TD>
                  <TD className="text-right">
                    <Button variant="ghost" size="sm" disabled={busy === i.id} onClick={() => run(i.id, async () => setLink(await teamService.regenerate(i.id)))}>
                      {busy === i.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Novo link
                    </Button>
                    <Button variant="ghost" size="sm" disabled={busy === i.id} onClick={() => run(i.id, () => teamService.revoke(i.id), 'Convite revogado.')}>
                      <X className="size-4" /> Revogar
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      {openTickets.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Meus chamados abertos</h3>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {openTickets.map((t) => (
              <li key={t.id}>
                {ticketLabel[t.type]}
                {t.targetUserId && ` — ${members.find((m) => m.userId === t.targetUserId)?.name ?? 'funcionário'}`} · aberto em {formatDate(t.createdAt)}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-1 text-xs">Até o atendimento, o acesso do funcionário continua ativo.</p>
        </div>
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSubmit={(v) => teamService.invite({ name: v.name, email: v.email })}
        onDone={team.reload}
      />

      <Modal
        open={!!link}
        onOpenChange={(o) => !o && setLink(null)}
        title="Novo link gerado"
        description="O link anterior deixou de valer."
      >
        {link && (
          <div className="space-y-4">
            <CopyLinkBox token={link.token} name={link.invitation.name} />
            <div className="flex justify-end">
              <Button onClick={() => setLink(null)}><Link2 className="size-4" /> Concluir</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!ticketFor}
        onOpenChange={(o) => !o && setTicketFor(null)}
        title={ticketFor?.status === 'DISABLED' ? 'Solicitar reativação' : 'Solicitar remoção de acesso'}
        description={ticketFor ? `${ticketFor.name} (${ticketFor.email}). Nosso time executa o pedido; até lá o acesso continua ativo.` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setTicketFor(null)}>Cancelar</Button>
            <Button onClick={openTicket}>Abrir chamado</Button>
          </>
        }
      >
        <Field label="Motivo (opcional)" htmlFor="ticket-msg">
          <Textarea id="ticket-msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
        </Field>
      </Modal>
    </div>
  )
}
