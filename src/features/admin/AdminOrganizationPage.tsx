import { ArrowLeft, KeyRound, Plus, RefreshCw, UserCheck, UserMinus, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/dialog'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { CopyLinkBox } from '@/features/team/CopyLinkBox'
import { InviteDialog } from '@/features/team/InviteDialog'
import { formatDate, hoursLeft, roleLabel } from '@/features/team/labels'
import { errorMessage, useApi } from '@/hooks/useApi'
import { adminService } from '@/services/admin'

export default function AdminOrganizationPage() {
  const { id = '' } = useParams()
  const toast = useToast()
  const team = useApi(() => adminService.team(id), [id])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [link, setLink] = useState<{ token: string; name: string; title: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

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

  if (team.error) return <ErrorNotice message={team.error} onRetry={team.reload} />
  if (!team.data) return <TableSkeleton rows={4} />
  const { members, invitations, seats, plan, audit } = team.data

  return (
    <>
      <Link to="/admin" className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Empresas
      </Link>
      <PageHeader
        title="Equipe da empresa"
        description={`${seats.active} ativo(s)${seats.pending ? ` + ${seats.pending} pendente(s)` : ''} de ${seats.limit} · plano ${plan.label}${plan.expired ? ' (expirado)' : ''}`}
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="size-4" /> Convidar
          </Button>
        }
      />

      <Card className="gap-0 p-0">
        <Table aria-label="Membros">
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
                <TD>
                  <Badge variant={m.status === 'DISABLED' ? 'outline' : 'secondary'}>
                    {m.status === 'DISABLED' ? 'Desativado' : m.removalRequested ? 'Remoção solicitada' : 'Ativo'}
                  </Badge>
                </TD>
                <TD>{formatDate(m.lastAccessAt)}</TD>
                <TD className="text-right">
                  <Button variant="ghost" size="sm" disabled={busy === m.userId}
                    onClick={() => run(m.userId, async () => { const r = await adminService.resetAccess(id, m.userId); setLink({ token: r.token, name: m.name, title: 'Link de redefinição de senha' }) })}>
                    <KeyRound className="size-4" /> Redefinir senha
                  </Button>
                  {m.status === 'DISABLED' ? (
                    <Button variant="ghost" size="sm" disabled={busy === m.userId} onClick={() => run(m.userId, () => adminService.updateMember(id, m.userId, { disabled: false }), 'Acesso reativado.')}>
                      <UserCheck className="size-4" /> Reativar
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled={busy === m.userId} onClick={() => run(m.userId, () => adminService.updateMember(id, m.userId, { disabled: true }), 'Acesso desativado.')}>
                      <UserMinus className="size-4" /> Desativar
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {invitations.length > 0 && (
        <Card className="mt-6 gap-0 p-0">
          <h3 className="px-4 pt-4 text-sm font-semibold">Convites pendentes</h3>
          <Table aria-label="Convites pendentes">
            <TBody>
              {invitations.map((i) => (
                <TR key={i.id}>
                  <TD>
                    <p className="font-medium">{i.name}</p>
                    <p className="text-muted-foreground text-xs">{i.email}</p>
                  </TD>
                  <TD>{roleLabel[i.role]}</TD>
                  <TD><Badge variant="outline">expira em {hoursLeft(i.expiresAt)}</Badge></TD>
                  <TD className="text-right">
                    <Button variant="ghost" size="sm" disabled={busy === i.id}
                      onClick={() => run(i.id, async () => { const r = await adminService.regenerate(id, i.id); setLink({ token: r.token, name: i.name, title: 'Novo link gerado' }) })}>
                      <RefreshCw className="size-4" /> Novo link
                    </Button>
                    <Button variant="ghost" size="sm" disabled={busy === i.id} onClick={() => run(i.id, () => adminService.revoke(id, i.id), 'Convite revogado.')}>
                      <X className="size-4" /> Revogar
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {audit.length > 0 && (
        <Card className="mt-6 gap-2 p-4">
          <h3 className="text-sm font-semibold">Histórico recente</h3>
          <ul className="text-muted-foreground space-y-1 text-xs">
            {audit.map((a) => (
              <li key={a.id}>
                {formatDate(a.createdAt)} · {a.action}
                {a.targetName ? ` · ${a.targetName}` : ''}
                {a.actorName ? ` (por ${a.actorName})` : ''}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        allowRole
        onSubmit={(v) => adminService.invite(id, v)}
        onDone={team.reload}
      />
      <Modal open={!!link} onOpenChange={(o) => !o && setLink(null)} title={link?.title ?? ''} description={link ? `Para ${link.name}.` : ''}>
        {link && (
          <div className="space-y-4">
            <CopyLinkBox token={link.token} name={link.name} />
            <div className="flex justify-end">
              <Button onClick={() => setLink(null)}>Concluir</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
