import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const navigate = useNavigate()
  const [v, setV] = useState({ name: '', email: '', password: '', confirm: '', company: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof v, string>>>({})
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const n: typeof errors = {}
    if (v.name.trim().length < 3) n.name = 'Informe seu nome completo.'
    if (!emailRe.test(v.email)) n.email = 'Informe um e-mail válido.'
    if (v.password.length < 8) n.password = 'A senha deve ter ao menos 8 caracteres.'
    if (v.confirm !== v.password) n.confirm = 'As senhas não coincidem.'
    if (!v.company.trim()) n.company = 'Informe o nome da empresa.'
    setErrors(n)
    if (Object.keys(n).length === 0) navigate('/')
  }

  return (
    <AuthShell>
      <h2 className="text-2xl font-semibold tracking-tight">Crie sua conta</h2>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">Comece a gerar orçamentos em minutos.</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Nome completo" htmlFor="name" error={errors.name}>
          <Input id="name" value={v.name} onChange={set('name')} />
        </Field>
        <Field label="E-mail" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" value={v.email} onChange={set('email')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Senha" htmlFor="password" error={errors.password}>
            <Input id="password" type="password" value={v.password} onChange={set('password')} />
          </Field>
          <Field label="Confirmar senha" htmlFor="confirm" error={errors.confirm}>
            <Input id="confirm" type="password" value={v.confirm} onChange={set('confirm')} />
          </Field>
        </div>
        <Field label="Nome da empresa" htmlFor="company" error={errors.company}>
          <Input id="company" value={v.company} onChange={set('company')} />
        </Field>
        <Button type="submit" className="w-full">
          Criar minha conta
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Já tem conta?{' '}
        <Link to="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  )
}
