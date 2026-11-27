import { Building2, Loader2, Plus, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/dialog'
import { Field, Select } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { CopyLinkBox } from '@/features/team/CopyLinkBox'
import { formatDate } from '@/features/team/labels'
import { availableSegments } from '@/features/onboarding/segments'
import { errorMessage, useApi, useDebounced } from '@/hooks/useApi'
import { adminService } from '@/services/admin'
import type { InviteResult } from '@/services/team'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AdminOrganizationsPage() {
  const [q, setQ] = useState('')
  const debounced = useDebounced(q)
  const orgs = useApi(() => adminService.organizations(debounced), [debounced])
  const [open, setOpen] = useState(false)
  const [v, setV] = useState({ name: '', niche: '', ownerName: '', ownerEmail: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof v | 'form', string>>>({})
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<(InviteResult & { organization: { id: string; name: string } }) | null>(null)
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }))

  function close(next: boolean) {
    setOpen(next)
    if (!next) {
      if (created) orgs.reload()
      setV({ name: '', niche: '', ownerName: '', ownerEmail: '' })
      setErrors({})
      setCreated(null)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n: typeof errors = {}
    if (v.name.trim().length < 2) n.name = 'Informe o nome da empresa.'
    if (v.ownerName.trim().length < 2) n.ownerName = 'Informe o nome do proprietário.'
    if (!emailRe.test(v.ownerEmail.trim())) n.ownerEmail = 'Informe um e-mail válido.'
    setErrors(n)
    if (Object.keys(n).length) return
    setLoading(true)
    try {
      setCreated(
        await adminService.createOrganization({
          name: v.name.trim(),
          ...(v.niche ? { niche: v.niche } : {}),
          ownerName: v.ownerName.trim(),
          ownerEmail: v.ownerEmail.trim().toLowerCase(),
        }),
      )
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Empresas"
        description="Crie empresas em trial e convide o proprietário."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Nova empresa
          </Button>
        }
      />
      <Card className="gap-4 p-0">
        <div className="relative p-4 pb-0">
          <Search className="text-muted-foreground absolute top-1/2 left-7 size-4 translate-y-[-25%]" />
          <Input aria-label="Buscar empresa" placeholder="Buscar por nome" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {orgs.error ? (
          <ErrorNotice message={orgs.error} onRetry={orgs.reload} />
        ) : !orgs.data ? (
          <TableSkeleton />
        ) : orgs.data.organizations.length === 0 ? (
          <EmptyState icon={Building2} title="Nenhuma empresa" description="Crie a primeira empresa para convidar o proprietário." />
        ) : (
          <Table aria-label="Empresas">
            <THead>
              <TR>
                <TH>Empresa</TH>
                <TH>Plano</TH>
                <TH>Vagas</TH>
                <TH>Criada em</TH>
              </TR>
            </THead>
            <TBody>
              {orgs.data.organizations.map((o) => (
                <TR key={o.id}>
                  <TD>
                    <Link to={`/admin/empresas/${o.id}`} className="font-medium underline-offset-4 hover:underline">{o.name}</Link>
                  </TD>
                  <TD>{o.planLabel}</TD>
                  <TD>
                    {o.seats.active}
                    {o.seats.pending > 0 ? ` + ${o.seats.pending} pend.` : ''} / {o.seats.limit}
                  </TD>
                  <TD>{formatDate(o.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        onOpenChange={close}
        title={created ? 'Empresa criada' : 'Nova empresa'}
        description={created ? `Envie o link para o proprietário de ${created.organization.name}.` : 'A empresa começa em trial de 7 dias.'}
      >
        {created ? (
          <div className="space-y-4">
            <CopyLinkBox token={created.token} name={created.invitation.name} />
            <div className="flex justify-end">
              <Button onClick={() => close(false)}>Concluir</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            {errors.form && <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{errors.form}</div>}
            <Field label="Nome da empresa" htmlFor="org-name" error={errors.name}>
              <Input id="org-name" value={v.name} onChange={set('name')} />
            </Field>
            <Field label="Segmento" htmlFor="org-niche">
              <Select id="org-niche" value={v.niche} onChange={set('niche')}>
                <option value="">Sem modelo de catálogo</option>
                {availableSegments.map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nome do proprietário" htmlFor="org-owner" error={errors.ownerName}>
              <Input id="org-owner" value={v.ownerName} onChange={set('ownerName')} />
            </Field>
            <Field label="E-mail do proprietário" htmlFor="org-owner-email" error={errors.ownerEmail}>
              <Input id="org-owner-email" type="email" value={v.ownerEmail} onChange={set('ownerEmail')} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => close(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />} Criar empresa
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
