import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/services/api'
import { customersService } from '@/services/customers'
import type { Customer } from '@/types'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const blank = { name: '', phone: '', email: '' }

export function ClientFormModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: (c: Customer) => void
}) {
  const [v, setV] = useState(blank)
  const [errors, setErrors] = useState<Partial<typeof v & { form: string }>>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n: typeof errors = {}
    if (v.name.trim().length < 2) n.name = 'Informe o nome.'
    if (v.phone.replace(/\D/g, '').length < 10) n.phone = 'Informe um telefone válido.'
    if (v.email && !emailRe.test(v.email)) n.email = 'E-mail inválido.'
    setErrors(n)
    if (Object.keys(n).length) return

    setSaving(true)
    try {
      const customer = await customersService.create({
        name: v.name.trim(),
        phone: v.phone.trim(),
        ...(v.email.trim() ? { email: v.email.trim() } : {}),
      })
      setV(blank)
      onSaved(customer)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.details?.length) {
        setErrors({
          name: err.fieldMessage('name'),
          phone: err.fieldMessage('phone'),
          email: err.fieldMessage('email'),
        })
      } else {
        setErrors({ form: err instanceof ApiError ? err.message : 'Não foi possível salvar o cliente.' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Novo cliente" description="Cadastre rapidamente os dados principais.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {errors.form && (
          <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
            {errors.form}
          </div>
        )}
        <Field label="Nome" htmlFor="cf-name" error={errors.name}>
          <Input id="cf-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone" htmlFor="cf-phone" error={errors.phone}>
            <Input id="cf-phone" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} placeholder="(11) 90000-0000" />
          </Field>
          <Field label="E-mail" htmlFor="cf-email" error={errors.email}>
            <Input id="cf-email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" disabled={saving}>Salvar cliente</Button>
        </div>
      </form>
    </Modal>
  )
}
