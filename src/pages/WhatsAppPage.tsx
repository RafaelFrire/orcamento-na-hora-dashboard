import { AlertTriangle, CheckCircle2, ChevronDown, ExternalLink, Info, Loader2, MessageCircle, MessagesSquare } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { errorMessage, useApi } from '@/hooks/useApi'
import { maskDigits } from '@/lib/format'
import { API_URL, ApiError } from '@/services/api'
import { whatsappService } from '@/services/whatsapp'

const blank = { phoneNumberId: '', wabaId: '', accessToken: '' }

const META_LINKS = {
  apps: 'https://developers.facebook.com/apps',
  manager: 'https://business.facebook.com/wa/manage/home',
  systemUsers: 'https://business.facebook.com/settings/system-users',
}

function GuideLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 font-medium underline underline-offset-2">
      {children} <ExternalLink className="size-3" aria-hidden />
    </a>
  )
}

function StepNumber({ n }: { n: number }) {
  return <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">{n}</span>
}

/** Passo a passo para o cliente conseguir os 3 dados sozinho. Sempre visível; os links abrem a Meta em outra aba. */
function ConnectGuide() {
  return (
    <details aria-label="Como conectar" className="bg-muted/40 group max-w-xl rounded-md border p-5 text-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
        <span>Como conseguir os dados (leva uns 10 minutos)</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <p className="text-muted-foreground mt-2">Você precisa de uma conta no Meta Business Suite e de um número que possa receber o código de verificação por SMS ou ligação.</p>
      <ol className="mt-4 space-y-4">
        <li className="flex gap-3">
          <StepNumber n={1} />
          <div className="space-y-1">
            <p className="font-medium">Crie o app e adicione o WhatsApp</p>
            <p className="text-muted-foreground">
              Em <GuideLink href={META_LINKS.apps}>Meus apps (Meta for Developers)</GuideLink>, clique em <strong>Criar app</strong>, escolha o caso de uso{' '}
              <strong>Conectar-se com clientes pelo WhatsApp</strong> e vincule ao seu negócio.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <StepNumber n={2} />
          <div className="space-y-1">
            <p className="font-medium">Copie o Phone number ID e o Account ID</p>
            <p className="text-muted-foreground">
              No app, abra <strong>WhatsApp &gt; Configuração da API</strong>, adicione e verifique o seu número e copie o <strong>Phone number ID</strong> e o{' '}
              <strong>WhatsApp Business Account ID</strong>. Você também encontra esses códigos no <GuideLink href={META_LINKS.manager}>WhatsApp Manager</GuideLink>.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <StepNumber n={3} />
          <div className="space-y-1">
            <p className="font-medium">Gere um token que não expira</p>
            <p className="text-muted-foreground">
              O token temporário dessa mesma tela vale só ~24 horas. Em <GuideLink href={META_LINKS.systemUsers}>Usuários do sistema</GuideLink>:
            </p>
            <ul className="text-muted-foreground list-disc space-y-0.5 pl-5">
              <li>crie um usuário com função <strong>Admin</strong>;</li>
              <li>em <strong>Atribuir ativos</strong>, dê a ele acesso ao seu app e à sua conta do WhatsApp Business (controle total);</li>
              <li>clique em <strong>Gerar token</strong>, escolha o app e marque <code>whatsapp_business_messaging</code> e <code>whatsapp_business_management</code>;</li>
              <li>se aparecer a opção de expiração, escolha <strong>Nunca</strong>.</li>
            </ul>
            <p className="text-muted-foreground text-xs">Copie o token na hora: a Meta não mostra de novo.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <StepNumber n={4} />
          <div className="space-y-1">
            <p className="font-medium">Cole os três dados no formulário abaixo</p>
            <p className="text-muted-foreground">Depois de conectar, siga as instruções do cartão <em>Webhook na Meta</em> para receber as mensagens.</p>
          </div>
        </li>
      </ol>
      <p className="text-muted-foreground mt-4 text-xs">Os nomes dos menus podem mudar na interface da Meta. Se algo não bater, procure pelo nome em negrito.</p>
    </details>
  )
}

export default function WhatsAppPage() {
  const toast = useToast()
  const { membership } = useAuth()
  const canEdit = membership?.role === 'OWNER' || membership?.role === 'ADMIN'
  const { data: connection, error, loading, reload } = useApi(() => whatsappService.connection(), [])
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Partial<typeof blank & { form: string }>>({})
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const connected = connection?.connected === true && !editing
  const webhookUrl = `${API_URL || window.location.origin}${connection?.webhook.path ?? '/api/webhooks/whatsapp'}`

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n: typeof errors = {}
    if (!/^\d{5,30}$/.test(form.phoneNumberId.trim())) n.phoneNumberId = 'Informe o Phone number ID (somente dígitos).'
    if (!/^\d{5,30}$/.test(form.wabaId.trim())) n.wabaId = 'Informe o ID da conta do WhatsApp Business (somente dígitos).'
    if (form.accessToken.trim().length < 20) n.accessToken = 'Informe o token de acesso.'
    setErrors(n)
    if (Object.keys(n).length) return

    setSaving(true)
    try {
      await whatsappService.connect({
        phoneNumberId: form.phoneNumberId.trim(),
        wabaId: form.wabaId.trim(),
        accessToken: form.accessToken.trim(),
      })
      setForm(blank)
      setEditing(false)
      toast('WhatsApp conectado com sucesso.')
      reload()
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.details?.length) {
        setErrors({
          phoneNumberId: err.fieldMessage('phoneNumberId'),
          wabaId: err.fieldMessage('wabaId'),
          accessToken: err.fieldMessage('accessToken'),
        })
      } else {
        setErrors({ form: errorMessage(err) })
      }
    } finally {
      setSaving(false)
    }
  }

  async function disconnect() {
    try {
      await whatsappService.disconnect()
      toast('WhatsApp desconectado.')
      reload()
    } catch (err) {
      toast(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader title="WhatsApp" description="Conecte o número da empresa para atender e orçar pelo painel" />

      {error ? (
        <Card><ErrorNotice message={error} onRetry={reload} /></Card>
      ) : loading && !connection ? (
        <Card><TableSkeleton rows={3} /></Card>
      ) : connected ? (
        <Card className="gap-5 p-8">
          {connection?.tokenStatus === 'INVALID' && (
            <div role="alert" className="bg-destructive/10 text-destructive flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3 text-sm">
              <span className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong>O token do WhatsApp é inválido ou expirou.</strong> Enquanto isso, não é possível enviar nem receber mensagens. Gere um novo token e atualize as credenciais.
                </span>
              </span>
              {canEdit ? (
                <Button size="sm" variant="destructive" onClick={() => setEditing(true)}>Atualizar credenciais</Button>
              ) : (
                <span>Peça a um proprietário ou administrador para atualizar.</span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-success/15 text-success flex size-12 items-center justify-center rounded-full"><CheckCircle2 className="size-6" /></span>
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  Conexão ativa <span className="bg-success size-2 animate-pulse rounded-full" />
                </p>
                <p className="text-muted-foreground text-sm">Mensagens recebidas aparecem em Conversas.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline"><Link to="/conversas"><MessagesSquare /> Abrir conversas</Link></Button>
              {canEdit && <Button variant="outline" onClick={() => setEditing(true)}>Atualizar credenciais</Button>}
              {canEdit && <Button variant="outline" onClick={() => setConfirm(true)}>Desconectar</Button>}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t pt-5 text-sm">
            <div><dt className="text-muted-foreground">Número conectado</dt><dd className="font-medium">{maskDigits(connection?.displayPhone)}</dd></div>
            <div><dt className="text-muted-foreground">Nome verificado</dt><dd className="font-medium">{connection?.verifiedName ?? '—'}</dd></div>
            <div><dt className="text-muted-foreground">Phone number ID</dt><dd className="font-mono text-xs">{maskDigits(connection?.phoneNumberId)}</dd></div>
            <div><dt className="text-muted-foreground">WhatsApp Business Account ID</dt><dd className="font-mono text-xs">{maskDigits(connection?.wabaId)}</dd></div>
          </dl>
        </Card>
      ) : (
        <Card className="gap-5 p-8">
          <div className="flex items-center gap-3">
            <span className="bg-success/15 text-success flex size-12 items-center justify-center rounded-full"><MessageCircle className="size-6" /></span>
            <div>
              <h2 className="text-lg font-semibold">{editing ? 'Atualizar credenciais' : 'Conecte seu WhatsApp Business'}</h2>
              <p className="text-muted-foreground text-sm">Use os dados do seu app na Meta (WhatsApp &gt; Configuração da API). O token fica guardado criptografado no servidor.</p>
            </div>
          </div>
          {!canEdit ? (
            <p className="text-muted-foreground text-sm">Peça a um proprietário ou administrador para conectar o WhatsApp.</p>
          ) : (
            <>
            <ConnectGuide />
            <form onSubmit={submit} noValidate className="max-w-xl space-y-4">
              {errors.form && <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{errors.form}</div>}
              <Field label="Phone number ID" htmlFor="wa-phone" error={errors.phoneNumberId}>
                <Input id="wa-phone" inputMode="numeric" value={form.phoneNumberId} onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })} />
              </Field>
              <Field label="WhatsApp Business Account ID" htmlFor="wa-waba" error={errors.wabaId}>
                <Input id="wa-waba" inputMode="numeric" value={form.wabaId} onChange={(e) => setForm({ ...form, wabaId: e.target.value })} />
              </Field>
              <Field label="Token de acesso" htmlFor="wa-token" error={errors.accessToken}>
                <Input id="wa-token" type="password" autoComplete="off" value={form.accessToken} onChange={(e) => setForm({ ...form, accessToken: e.target.value })} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />} Conectar WhatsApp</Button>
                {editing && <Button type="button" variant="outline" onClick={() => { setEditing(false); setErrors({}) }}>Cancelar</Button>}
              </div>
            </form>
            </>
          )}
        </Card>
      )}

      {connection && (
        <Card className="mt-5 gap-3 p-6">
          <h2 className="flex items-center gap-2 font-semibold"><Info className="text-primary size-4" /> Webhook na Meta</h2>
          <p className="text-muted-foreground text-sm">
            No painel do app (WhatsApp &gt; Configuração), cadastre o webhook abaixo, informe o mesmo token de verificação do servidor
            e assine os campos <code>messages</code> e, se usar Coexistence, <code>smb_message_echoes</code>.
          </p>
          <dl className="grid grid-cols-[180px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">URL de retorno</dt><dd className="font-mono text-xs break-all">{webhookUrl}</dd>
            <dt className="text-muted-foreground">Token de verificação</dt>
            <dd>{connection.webhook.verifyTokenConfigured ? 'Configurado no servidor (META_VERIFY_TOKEN)' : <span className="text-destructive">Não configurado no servidor</span>}</dd>
            <dt className="text-muted-foreground">Segredo do app</dt>
            <dd>{connection.webhook.appSecretConfigured ? 'Configurado no servidor (META_APP_SECRET)' : <span className="text-destructive">Não configurado no servidor</span>}</dd>
          </dl>
        </Card>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Desconectar WhatsApp?"
        description="As conversas já recebidas continuam salvas. Você poderá reconectar a qualquer momento."
        confirmLabel="Desconectar"
        onConfirm={disconnect}
      />
    </>
  )
}
