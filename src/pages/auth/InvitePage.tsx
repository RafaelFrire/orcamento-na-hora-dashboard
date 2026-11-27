import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useApi } from '@/hooks/useApi'
import { ApiError } from '@/services/api'
import { invitationService } from '@/services/team'

export default function InvitePage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { startSession } = useAuth()
  const info = useApi(() => invitationService.get(token), [token])
  const [v, setV] = useState({ name: null as string | null, password: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof v | 'form', string>>>({})
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }))

  const invitation = info.data?.invitation

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!invitation) return
    const isNew = invitation.type === 'INVITE' && !invitation.hasAccount
    const isReset = invitation.type === 'RESET'
    const n: typeof errors = {}
    const name = (v.name ?? invitation.name).trim()
    if (isNew && name.length < 2) n.name = 'Informe seu nome.'
    if (!v.password) n.password = 'Informe a senha.'
    else if ((isNew || isReset) && v.password.length < 8) n.password = 'A senha deve ter pelo menos 8 caracteres.'
    if ((isNew || isReset) && v.confirm !== v.password) n.confirm = 'As senhas não conferem.'
    setErrors(n)
    if (Object.keys(n).length) return

    setLoading(true)
    try {
      const res = await invitationService.accept(token, { ...(isNew ? { name } : {}), password: v.password })
      startSession(res)
      navigate(res.user.isPlatformAdmin && res.memberships.length === 0 ? '/admin' : '/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setErrors({ password: 'Senha incorreta para esta conta.' })
      else setErrors({ form: err instanceof ApiError ? err.message : 'Não foi possível concluir. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {info.loading ? (
        <div role="status" aria-label="Carregando" className="flex justify-center py-10">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : !invitation ? (
        <>
          <h2 className="text-2xl font-semibold tracking-tight">Convite inválido ou expirado</h2>
          <p className="text-muted-foreground mt-2 text-sm">Peça um novo link ao responsável pela empresa.</p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold tracking-tight">
            {invitation.type === 'RESET' ? 'Definir nova senha' : `Entrar em ${invitation.organizationName}`}
          </h2>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">
            {invitation.type === 'RESET'
              ? 'Escolha uma nova senha para acessar sua conta.'
              : invitation.hasAccount
                ? 'Você já tem conta. Confirme sua senha para entrar nesta empresa.'
                : 'Crie sua senha para começar a usar o sistema.'}
          </p>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {errors.form && (
              <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                {errors.form}
              </div>
            )}
            <Field label="E-mail" htmlFor="inv-email">
              <Input id="inv-email" type="email" value={invitation.email} readOnly />
            </Field>
            {invitation.type === 'INVITE' && !invitation.hasAccount && (
              <Field label="Seu nome" htmlFor="inv-name" error={errors.name}>
                <Input id="inv-name" value={v.name ?? invitation.name} onChange={set('name')} />
              </Field>
            )}
            <Field label={invitation.type === 'INVITE' && invitation.hasAccount ? 'Senha da sua conta' : 'Senha'} htmlFor="inv-pass" error={errors.password}>
              <Input id="inv-pass" type="password" autoComplete={invitation.hasAccount && invitation.type === 'INVITE' ? 'current-password' : 'new-password'} value={v.password} onChange={set('password')} />
            </Field>
            {(invitation.type === 'RESET' || !invitation.hasAccount) && (
              <Field label="Confirmar senha" htmlFor="inv-confirm" error={errors.confirm}>
                <Input id="inv-confirm" type="password" autoComplete="new-password" value={v.confirm} onChange={set('confirm')} />
              </Field>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />} {invitation.type === 'RESET' ? 'Salvar e entrar' : 'Aceitar convite'}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
