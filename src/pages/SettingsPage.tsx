import { useEffect, useState, type FormEvent } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Textarea } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { TeamPanel } from '@/features/team/TeamPanel'
import { errorMessage, useApi } from '@/hooks/useApi'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api'
import { templateService } from '@/services/template'
import type { QuoteTemplate } from '@/types'

const sections = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'perfil', label: 'Perfil' },
  { key: 'equipe', label: 'Equipe' },
  { key: 'orcamento', label: 'Personalização de orçamento' },
] as const

type Form = {
  companyName: string
  document: string
  phone: string
  email: string
  address: string
  website: string
  primaryColor: string
  commercialTerms: string
  footerText: string
  validityDays: string
}

const toForm = (t: QuoteTemplate): Form => ({
  companyName: t.companyName,
  document: t.document ?? '',
  phone: t.phone ?? '',
  email: t.email ?? '',
  address: t.address ?? '',
  website: t.website ?? '',
  primaryColor: t.primaryColor,
  commercialTerms: t.commercialTerms ?? '',
  footerText: t.footerText ?? '',
  validityDays: String(t.validityDays),
})

export default function SettingsPage() {
  const toast = useToast()
  const { user, membership } = useAuth()
  const canEdit = membership?.role === 'OWNER' || membership?.role === 'ADMIN'
  const [section, setSection] = useState<(typeof sections)[number]['key']>('empresa')
  const template = useApi(() => templateService.get(), [])
  const [form, setForm] = useState<Form | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof Form | 'form', string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (template.data) setForm(toForm(template.data))
  }, [template.data])

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f))

  async function save(e?: FormEvent) {
    e?.preventDefault()
    if (!form) return
    const n: typeof errors = {}
    if (form.companyName.trim().length < 2) n.companyName = 'Informe o nome da empresa.'
    if (!/^#[0-9a-fA-F]{6}$/.test(form.primaryColor)) n.primaryColor = 'Use o formato #RRGGBB.'
    const days = Number(form.validityDays)
    if (!Number.isInteger(days) || days < 1 || days > 365) n.validityDays = 'Informe de 1 a 365 dias.'
    setErrors(n)
    if (Object.keys(n).length) return

    setSaving(true)
    try {
      const saved = await templateService.save({
        companyName: form.companyName.trim(),
        document: form.document.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        website: form.website.trim() || null,
        primaryColor: form.primaryColor,
        commercialTerms: form.commercialTerms.trim() || null,
        footerText: form.footerText.trim() || null,
        validityDays: days,
      })
      setForm(toForm(saved))
      toast('Alterações salvas com sucesso.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.details?.length) {
        const next: typeof errors = {}
        for (const d of err.details) if (d.field && d.field in form) next[d.field as keyof Form] = d.message
        next.form = Object.keys(next).length ? undefined : err.message
        setErrors(next)
      } else {
        setErrors({ form: errorMessage(err) })
      }
    } finally {
      setSaving(false)
    }
  }

  const saveButton = canEdit ? (
    <div><Button type="submit" disabled={saving}>Salvar alterações</Button></div>
  ) : (
    <p className="text-muted-foreground text-sm">Somente proprietários e administradores podem alterar estas informações.</p>
  )

  return (
    <>
      <PageHeader title="Configurações" description="Gerencie sua conta e preferências" />
      <div className="grid grid-cols-[240px_1fr] items-start gap-6">
        <nav aria-label="Seções de configurações" className="bg-card flex flex-col gap-1 rounded-xl border p-2">
          {sections.filter((s) => s.key !== 'equipe' || membership?.role === 'OWNER').map((s) => (
            <button key={s.key} type="button" aria-current={section === s.key ? 'page' : undefined} onClick={() => setSection(s.key)}
              className={cn('rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent', section === s.key && 'bg-accent border-l-2 border-primary')}>
              {s.label}
            </button>
          ))}
        </nav>

        <Card className="gap-5 p-8">
          {section === 'equipe' ? (
            <TeamPanel />
          ) : section === 'perfil' ? (
            <>
              <h2 className="text-lg font-semibold">Perfil</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome" htmlFor="nome"><Input id="nome" value={user?.name ?? ''} readOnly /></Field>
                <Field label="E-mail" htmlFor="p-email"><Input id="p-email" value={user?.email ?? ''} readOnly /></Field>
                <Field label="Empresa" htmlFor="p-org"><Input id="p-org" value={membership?.name ?? ''} readOnly /></Field>
                <Field label="Função" htmlFor="p-role">
                  <Input id="p-role" readOnly value={{ OWNER: 'Proprietário', ADMIN: 'Administrador', MEMBER: 'Membro' }[membership?.role ?? 'MEMBER']} />
                </Field>
              </div>
              <p className="text-muted-foreground text-sm">A edição de perfil e a troca de senha ainda não estão disponíveis.</p>
            </>
          ) : template.error ? (
            <ErrorNotice message={template.error} onRetry={template.reload} />
          ) : !form ? (
            <TableSkeleton rows={4} />
          ) : (
            <form onSubmit={save} noValidate className="space-y-5">
              {errors.form && <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{errors.form}</div>}
              {section === 'empresa' && (
                <>
                  <h2 className="text-lg font-semibold">Empresa</h2>
                  <p className="text-muted-foreground -mt-3 text-sm">Estes dados aparecem como emitente no PDF do orçamento.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nome da empresa" htmlFor="fantasia" error={errors.companyName}><Input id="fantasia" value={form.companyName} onChange={set('companyName')} disabled={!canEdit} /></Field>
                    <Field label="CNPJ / CPF" htmlFor="cnpj" error={errors.document}><Input id="cnpj" value={form.document} onChange={set('document')} disabled={!canEdit} /></Field>
                    <Field label="Telefone" htmlFor="tel" error={errors.phone}><Input id="tel" value={form.phone} onChange={set('phone')} disabled={!canEdit} /></Field>
                    <Field label="E-mail" htmlFor="emp-email" error={errors.email}><Input id="emp-email" value={form.email} onChange={set('email')} disabled={!canEdit} /></Field>
                    <Field label="Endereço" htmlFor="end" error={errors.address}><Input id="end" value={form.address} onChange={set('address')} disabled={!canEdit} /></Field>
                    <Field label="Site" htmlFor="site" error={errors.website}><Input id="site" value={form.website} onChange={set('website')} disabled={!canEdit} /></Field>
                  </div>
                  {saveButton}
                </>
              )}
              {section === 'orcamento' && (
                <>
                  <h2 className="text-lg font-semibold">Personalização de orçamento</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Cor principal" htmlFor="pdf-color" error={errors.primaryColor}>
                      <div className="flex items-center gap-2">
                        <input type="color" aria-label="Seletor de cor" className="size-9 shrink-0 cursor-pointer rounded border" value={/^#[0-9a-fA-F]{6}$/.test(form.primaryColor) ? form.primaryColor : '#1F4E79'} onChange={set('primaryColor')} disabled={!canEdit} />
                        <Input id="pdf-color" value={form.primaryColor} onChange={set('primaryColor')} disabled={!canEdit} />
                      </div>
                    </Field>
                    <Field label="Validade padrão (dias)" htmlFor="pdf-days" error={errors.validityDays}>
                      <Input id="pdf-days" type="number" min={1} max={365} value={form.validityDays} onChange={set('validityDays')} disabled={!canEdit} />
                    </Field>
                  </div>
                  <Field label="Condições comerciais padrão" htmlFor="pdf-terms" error={errors.commercialTerms}>
                    <Textarea id="pdf-terms" value={form.commercialTerms} onChange={set('commercialTerms')} disabled={!canEdit} placeholder="Ex.: Pagamento: 50% na aprovação e 50% na entrega." />
                  </Field>
                  <Field label="Texto do rodapé" htmlFor="pdf-footer" error={errors.footerText}>
                    <Input id="pdf-footer" value={form.footerText} onChange={set('footerText')} disabled={!canEdit} />
                  </Field>
                  {saveButton}
                </>
              )}
            </form>
          )}
        </Card>
      </div>
    </>
  )
}
