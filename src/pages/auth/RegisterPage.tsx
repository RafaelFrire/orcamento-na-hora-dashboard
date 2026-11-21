import { useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { availableSegments } from '@/features/onboarding/segments'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user, register } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [segment, setSegment] = useState<string | null>(null)
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
      await register({
        name: v.name.trim(),
        email: v.email.trim(),
        password: v.password,
        company: v.company.trim(),
        niche: segment ?? undefined,
      })
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

  const chosen = availableSegments.find((s) => s.key === segment)
  const login = (
    <p className="text-muted-foreground mt-6 text-center text-sm">
      Já tem conta?{' '}
      <Link to="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
        Entrar
      </Link>
    </p>
  )

  if (step === 1) {
    return (
      <AuthShell>
        <p className="text-muted-foreground text-xs font-medium">Passo 1 de 2</p>
        <h2 className="text-2xl font-semibold tracking-tight">Qual é o segmento da sua empresa?</h2>
        <p className="text-muted-foreground mt-1 mb-6 text-sm">
          Vamos preparar o catálogo com serviços e peças do seu ramo.
        </p>
        <div role="radiogroup" aria-label="Segmento da empresa" className="space-y-3">
          {availableSegments.map((s) => {
            const selected = segment === s.key
            return (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSegment(s.key)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                  selected ? 'border-primary bg-primary/5 ring-primary/30 ring-2' : 'hover:border-primary/60 hover:bg-accent/40',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                    selected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/40',
                  )}
                >
                  {selected && <Check className="size-3.5" />}
                </span>
                <span>
                  <span className="block font-medium">{s.name}</span>
                  <span className="text-muted-foreground block text-sm">{s.description}</span>
                  <ul className="text-muted-foreground mt-2 space-y-0.5 text-xs">
                    {s.highlights.map((h) => (
                      <li key={h}>• {h}</li>
                    ))}
                  </ul>
                </span>
              </button>
            )
          })}
          <div
            className="text-muted-foreground flex items-start gap-3 rounded-lg border border-dashed p-4"
            aria-label="Novidades em breve"
          >
            <Sparkles className="mt-0.5 size-5 shrink-0" />
            <span>
              <span className="text-foreground block font-medium">Novidades em breve</span>
              <span className="block text-sm">Estamos preparando modelos prontos para novos segmentos.</span>
            </span>
          </div>
        </div>
        <Button type="button" className="mt-6 w-full" disabled={!segment} onClick={() => setStep(2)}>
          Continuar
        </Button>
        {login}
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <p className="text-muted-foreground text-xs font-medium">Passo 2 de 2</p>
      <h2 className="text-2xl font-semibold tracking-tight">Crie sua conta</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">Comece a gerar orçamentos em minutos.</p>
      <div className="bg-secondary mb-5 flex items-center justify-between rounded-md px-3 py-2 text-sm">
        <span>
          Segmento: <strong>{chosen?.name}</strong>
        </span>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="size-3" /> Alterar
        </button>
      </div>
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
      {login}
    </AuthShell>
  )
}
