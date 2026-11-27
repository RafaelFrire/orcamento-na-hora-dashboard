import { ArrowLeft, CalendarPlus, KeyRound, Pencil, Plus, Power, PowerOff, RefreshCw, Trash2, UserCheck, UserMinus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/dialog'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { CopyLinkBox } from '@/features/team/CopyLinkBox'
import { InviteDialog } from '@/features/team/InviteDialog'
import { formatDate, hoursLeft, roleLabel } from '@/features/team/labels'
import { errorMessage, useApi } from '@/hooks/useApi'
import { formatCurrency } from '@/lib/format'
import { adminService } from '@/services/admin'

import { DeleteOrganizationModal } from './DeleteOrganizationModal'
import { centsToReais, daysUntil, paymentStatusLabel, subscriptionLabel } from './labels'

export default function AdminOrganizationPage() {
  const { id = '' } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const team = useApi(() => adminService.team(id), [id])
  const detail = useApi(() => adminService.organization(id), [id])
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
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

  async function update(input: { name?: string; extendTrialDays?: number; disabled?: boolean }, ok: string) {
    setBusy('org')
    try {
      await adminService.updateOrganization(id, input)
      toast(ok)
      detail.reload()
      team.reload()
      setRenameOpen(false)
    } catch (e) {
      toast(errorMessage(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  function submitRename(e: FormEvent) {
    e.preventDefault()
    if (newName.trim().length < 2) return
    void update({ name: newName.trim() }, 'Nome atualizado.')
  }

  if (team.error) return <ErrorNotice message={team.error} onRetry={team.reload} />
  if (!team.data) return <TableSkeleton rows={4} />
  const { members, invitations, seats, plan, audit } = team.data
  const org = detail.data?.organization
  const trialDays = org?.plan === 'TRIAL' ? daysUntil(org.trialEndsAt) : null

  return (
    <>
      <Link to="/admin/empresas" className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Empresas
      </Link>
      <PageHeader
        title={org?.name ?? 'Empresa'}
        description={`${seats.active} ativo(s)${seats.pending ? ` + ${seats.pending} pendente(s)` : ''} de ${seats.limit} · plano ${plan.label}${plan.expired ? ' (expirado)' : ''}`}
        actions={
          <>
            {org && (
              <>
                <Button variant="outline" onClick={() => { setNewName(org.name); setRenameOpen(true) }}>
                  <Pencil className="size-4" /> Editar nome
                </Button>
                {org.plan === 'TRIAL' && (
                  <Button variant="outline" disabled={busy === 'org'} onClick={() => update({ extendTrialDays: 7 }, 'Trial estendido em 7 dias.')}>
                    <CalendarPlus className="size-4" /> Estender trial (+7d)
                  </Button>
                )}
                <Button variant="outline" disabled={busy === 'org'} onClick={() => update({ disabled: !org.disabledAt }, org.disabledAt ? 'Empresa reativada.' : 'Empresa desativada.')}>
                  {org.disabledAt ? <Power className="size-4" /> : <PowerOff className="size-4" />}
                  {org.disabledAt ? 'Reativar empresa' : 'Desativar empresa'}
                </Button>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" /> Excluir empresa
                </Button>
              </>
            )}
            <Button onClick={() => setInviteOpen(true)}>
              <Plus className="size-4" /> Convidar
            </Button>
          </>
        }
      />

      {org?.disabledAt && (
        <div role="status" className="bg-destructive/10 text-destructive mb-5 rounded-md px-4 py-3 text-sm">
          Empresa desativada em {formatDate(org.disabledAt)}: ninguém da equipe consegue acessar. Os dados foram preservados.
        </div>
      )}

      {org && (
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="gap-2 p-5">
            <h3 className="text-sm font-semibold">Plano e assinatura</h3>
            <p className="text-sm">
              {org.planLabel}
              {trialDays !== null && (
                <span className="text-muted-foreground"> · {trialDays <= 0 ? 'trial expirado' : `trial termina em ${trialDays} dia(s)`}</span>
              )}
            </p>
            {org.subscription ? (
              <p className="text-muted-foreground text-xs">
                <Badge variant={org.subscription.status === 'ACTIVE' ? 'secondary' : 'outline'}>{subscriptionLabel[org.subscription.status]}</Badge>{' '}
                {formatCurrency(centsToReais(org.subscription.priceCents))}/mês
                {org.subscription.currentPeriodEnd ? ` · renova em ${formatDate(org.subscription.currentPeriodEnd)}` : ''}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">Sem assinatura.</p>
            )}
            <p className="text-muted-foreground text-xs">Criada em {formatDate(org.createdAt)}</p>
          </Card>
          <Card className="gap-2 p-5">
            <h3 className="text-sm font-semibold">Uso</h3>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Orçamentos</dt><dd className="text-right font-medium">{org.usage.quotes}</dd>
              <dt className="text-muted-foreground">Clientes</dt><dd className="text-right font-medium">{org.usage.customers}</dd>
              <dt className="text-muted-foreground">Itens no catálogo</dt><dd className="text-right font-medium">{org.usage.catalogItems}</dd>
              <dt className="text-muted-foreground">Usuários ativos</dt><dd className="text-right font-medium">{org.usage.members}</dd>
            </dl>
          </Card>
          <Card className="gap-2 p-5">
            <h3 className="text-sm font-semibold">Últimos pagamentos</h3>
            {!org.subscription || org.subscription.payments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum pagamento.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {org.subscription.payments.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span>{formatDate(p.paidAt ?? p.createdAt)} · {formatCurrency(centsToReais(p.amountCents))}</span>
                    <Badge variant={p.status === 'approved' ? 'secondary' : 'outline'}>{paymentStatusLabel(p.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">Equipe da empresa</h2>

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

      <Modal open={renameOpen} onOpenChange={setRenameOpen} title="Editar nome da empresa" description="O nome aparece para toda a equipe.">
        <form onSubmit={submitRename} noValidate className="space-y-4">
          <Field label="Nome da empresa" htmlFor="rename-org">
            <Input id="rename-org" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy === 'org' || newName.trim().length < 2}>Salvar</Button>
          </div>
        </form>
      </Modal>
      <DeleteOrganizationModal
        org={deleteOpen && org ? { id: org.id, name: org.name } : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          toast('Empresa excluída.')
          navigate('/admin/empresas')
        }}
      />
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
