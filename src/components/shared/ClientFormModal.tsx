import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { db } from '@/mocks/store'
import type { Client } from '@/types'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ClientFormModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: (c: Client) => void
}) {
  const [v, setV] = useState({ name: '', phone: '', email: '' })
  const [errors, setErrors] = useState<Partial<typeof v>>({})

  function submit(e: FormEvent) {
    e.preventDefault()
    const n: typeof errors = {}
    if (!v.name.trim()) n.name = 'Informe o nome.'
    if (v.phone.replace(/\D/g, '').length < 10) n.phone = 'Informe um telefone válido.'
    if (v.email && !emailRe.test(v.email)) n.email = 'E-mail inválido.'
    setErrors(n)
    if (Object.keys(n).length) return
    const client: Client = { id: `c${Date.now()}`, ...v, createdAt: '2026-11-19' }
    db.clients.unshift(client)
    setV({ name: '', phone: '', email: '' })
    onSaved(client)
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Novo cliente" description="Cadastre rapidamente os dados principais.">
      <form onSubmit={submit} noValidate className="space-y-4">
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
          <Button type="submit">Salvar cliente</Button>
        </div>
      </form>
    </Modal>
  )
}
