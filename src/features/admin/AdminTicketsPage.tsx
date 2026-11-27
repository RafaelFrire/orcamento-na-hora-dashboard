import { CheckCircle2, LifeBuoy } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/dialog'
import { Field, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import { formatDate, ticketLabel } from '@/features/team/labels'
import { errorMessage, useApi } from '@/hooks/useApi'
import { adminService, type AdminTicket } from '@/services/admin'

export default function AdminTicketsPage() {
  const toast = useToast()
  const tickets = useApi(() => adminService.tickets(), [])
  const [current, setCurrent] = useState<AdminTicket | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function resolve() {
    if (!current) return
    setSaving(true)
    try {
      await adminService.resolveTicket(current.id, note.trim() || undefined)
      toast('Chamado atendido.')
      setCurrent(null)
      setNote('')
      tickets.reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  const effect = (t: AdminTicket) =>
    t.type === 'REMOVE_MEMBER'
      ? 'Ao atender, o acesso será desativado e a vaga liberada.'
      : t.type === 'REACTIVATE_MEMBER'
        ? 'Ao atender, o acesso será reativado (exige vaga livre).'
        : 'Pedido livre: atenda manualmente e feche o chamado.'

  return (
    <>
      <PageHeader title="Chamados" description="Pedidos dos proprietários. Remoções aparecem primeiro." />
      {tickets.error ? (
        <ErrorNotice message={tickets.error} onRetry={tickets.reload} />
      ) : !tickets.data ? (
        <TableSkeleton rows={3} />
      ) : tickets.data.tickets.length === 0 ? (
        <Card><EmptyState icon={LifeBuoy} title="Nenhum chamado aberto" description="Quando um proprietário pedir uma remoção, ela aparece aqui." /></Card>
      ) : (
        <div className="space-y-3">
          {tickets.data.tickets.map((t) => (
            <Card key={t.id} className="flex-row items-start justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ticketLabel[t.type]}</span>
                  {t.urgent && <Badge variant="destructive">Urgente</Badge>}
                </div>
                <p className="text-sm">
                  <Link to={`/admin/empresas/${t.organization.id}`} className="underline underline-offset-4">{t.organization.name}</Link>
                  {t.target && <> — {t.target.name} ({t.target.email})</>}
                </p>
                {t.message && <p className="text-muted-foreground text-sm">“{t.message}”</p>}
                <p className="text-muted-foreground text-xs">
                  Aberto em {formatDate(t.createdAt)}{t.createdBy ? ` por ${t.createdBy.name}` : ''}
                </p>
              </div>
              <Button onClick={() => setCurrent(t)}>
                <CheckCircle2 className="size-4" /> Atender
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!current}
        onOpenChange={(o) => !o && setCurrent(null)}
        title="Atender chamado"
        description={current ? effect(current) : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setCurrent(null)}>Cancelar</Button>
            <Button onClick={resolve} disabled={saving}>Confirmar</Button>
          </>
        }
      >
        <Field label="Observação (opcional)" htmlFor="res-note">
          <Textarea id="res-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
      </Modal>
    </>
  )
}
