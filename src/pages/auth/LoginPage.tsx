import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/services/api'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!emailRe.test(email)) next.email = 'Informe um e-mail válido.'
    if (!password) next.password = 'Informe sua senha.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setErrors({ form: 'E-mail ou senha incorretos.' })
      else if (err instanceof Error && err.message === 'NO_MEMBERSHIP')
        setErrors({ form: 'Sua conta não está vinculada a nenhuma empresa. Fale com o suporte.' })
      else setErrors({ form: err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  if (user) return <Navigate to="/" replace />

  return (
    <AuthShell>
      <h2 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h2>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">Acesse sua conta para continuar.</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.form && (
          <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
            {errors.form}
          </div>
        )}
        <Field label="E-mail" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" placeholder="voce@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha" htmlFor="password" error={errors.password}>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-primary size-4" /> Lembrar acesso
          </label>
          <a href="#" className="text-foreground font-medium underline-offset-4 hover:underline">
            Esqueci minha senha
          </a>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />} Entrar
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Não tem uma conta?{' '}
        <Link to="/cadastro" className="text-foreground font-medium underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthShell>
  )
}
