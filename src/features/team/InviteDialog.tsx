import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Modal } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, Select } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/hooks/useApi'
import { ApiError } from '@/services/api'
import type { InviteResult } from '@/services/team'
import type { MemberRole } from '@/types'

import { CopyLinkBox } from './CopyLinkBox'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  /** Só o admin da plataforma pode escolher o papel (OWNER). */
  allowRole?: boolean
  onSubmit: (input: { name: string; email: string; role: MemberRole }) => Promise<InviteResult>
  onDone?: () => void
}

export function InviteDialog({ open, onOpenChange, title = 'Convidar funcionário', allowRole, onSubmit, onDone }: Props) {
  const [v, setV] = useState({ name: '', email: '', role: 'MEMBER' as MemberRole })
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InviteResult | null>(null)

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      if (result) onDone?.()
      setV({ name: '', email: '', role: 'MEMBER' })
      setErrors({})
      setResult(null)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n: typeof errors = {}
    if (v.name.trim().length < 2) n.name = 'Informe o nome.'
    if (!emailRe.test(v.email.trim())) n.email = 'Informe um e-mail válido.'
    setErrors(n)
    if (Object.keys(n).length) return
    setLoading(true)
    try {
      setResult(await onSubmit({ name: v.name.trim(), email: v.email.trim().toLowerCase(), role: v.role }))
    } catch (err) {
      setErrors({ form: err instanceof ApiError && err.status === 402 ? `${err.message} Faça upgrade do plano para liberar mais vagas.` : errorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={result ? 'Convite criado' : title}
      description={result ? `Envie o link para ${result.invitation.name}.` : 'A pessoa define a própria senha ao abrir o link.'}
    >
      {result ? (
        <div className="space-y-4">
          <CopyLinkBox token={result.token} name={result.invitation.name} />
          <div className="flex justify-end">
            <Button onClick={() => close(false)}>Concluir</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          {errors.form && (
            <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {errors.form}
            </div>
          )}
          <Field label="Nome" htmlFor="inv-name" error={errors.name}>
            <Input id="inv-name" value={v.name} onChange={(e) => setV((s) => ({ ...s, name: e.target.value }))} />
          </Field>
          <Field label="E-mail" htmlFor="inv-email" error={errors.email}>
            <Input id="inv-email" type="email" value={v.email} onChange={(e) => setV((s) => ({ ...s, email: e.target.value }))} />
          </Field>
          {allowRole && (
            <Field label="Papel" htmlFor="inv-role">
              <Select id="inv-role" value={v.role} onChange={(e) => setV((s) => ({ ...s, role: e.target.value as MemberRole }))}>
                <option value="MEMBER">Funcionário</option>
                <option value="OWNER">Proprietário</option>
              </Select>
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />} Gerar link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
