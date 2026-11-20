import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/services/api'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user, register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [v, setV] = useState({ name: '', email: '', password: '', confirm: '', company: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof v | 'form', string>>>({})
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const n: typeof errors = {}
    if (v.name.trim().length < 3) n.name = 'Informe seu nome completo.'
    if (!emailRe.test(v.email)) n.email = 'Informe um e-mail válido.'
    if (v.password.length < 8) n.password = 'A senha deve ter ao menos 8 caracteres.'
    else if (v.password.length > 72) n.password = 'A senha deve ter no máximo 72 caracteres.'
    if (v.confirm !== v.password) n.confirm = 'As senhas não coincidem.'
    if (!v.company.trim()) n.company = 'Informe o nome da empresa.'
    setErrors(n)
    if (Object.keys(n).length) return

    setLoading(true)
    try {
      await register({ name: v.name.trim(), email: v.email.trim(), password: v.password, company: v.company.trim() })
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ email: 'Este e-mail já está cadastrado.' })
      else if (err instanceof ApiError && err.status === 400)
        setErrors({ form: err.details?.[0]?.message ?? err.message })
      else setErrors({ form: err instanceof ApiError ? err.message : 'Não foi possível criar a conta. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  if (user) return <Navigate to="/" replace />

  return (
    <AuthShell>
      <h2 className="text-2xl font-semibold tracking-tight">Crie sua conta</h2>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">Comece a gerar orçamentos em minutos.</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.form && (
          <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
            {errors.form}
          </div>
        )}
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />} Criar minha conta
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
