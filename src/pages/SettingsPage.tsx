import { Upload } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Textarea } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { currentUser, planUsage } from '@/mocks/data'

const sections = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'perfil', label: 'Perfil' },
  { key: 'orcamento', label: 'Personalização de orçamento' },
  { key: 'plano', label: 'Plano e utilização' },
] as const

function LogoUpload({ label = 'Logotipo' }: { label?: string }) {
  return (
    <Field label={label}>
      <Button type="button" variant="outline"><Upload /> Enviar imagem</Button>
    </Field>
  )
}

export default function SettingsPage() {
  const toast = useToast()
  const [section, setSection] = useState<(typeof sections)[number]['key']>('empresa')
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const save = () => toast('Alterações salvas com sucesso.')
  const pct = Math.round((planUsage.used / planUsage.limit) * 100)

  return (
    <>
      <PageHeader title="Configurações" description="Gerencie sua conta e preferências" />
      <div className="grid grid-cols-[240px_1fr] items-start gap-6">
        <nav aria-label="Seções de configurações" className="bg-card flex flex-col gap-1 rounded-xl border p-2">
          {sections.map((s) => (
            <button key={s.key} type="button" aria-current={section === s.key ? 'page' : undefined} onClick={() => setSection(s.key)}
              className={cn('rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent', section === s.key && 'bg-accent border-l-2 border-primary')}>
              {s.label}
            </button>
          ))}
        </nav>

        <Card className="gap-5 p-8">
          {section === 'empresa' && (
            <>
              <h2 className="text-lg font-semibold">Empresa</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome fantasia" htmlFor="fantasia"><Input id="fantasia" defaultValue={currentUser.company} /></Field>
                <Field label="Razão social" htmlFor="razao"><Input id="razao" defaultValue="Acme Serviços Ltda." /></Field>
                <Field label="CNPJ" htmlFor="cnpj"><Input id="cnpj" defaultValue="12.345.678/0001-90" /></Field>
                <Field label="Telefone" htmlFor="tel"><Input id="tel" defaultValue="(11) 3000-0000" /></Field>
                <Field label="E-mail" htmlFor="emp-email"><Input id="emp-email" defaultValue="contato@acmeservicos.com.br" /></Field>
                <Field label="Endereço" htmlFor="end"><Input id="end" defaultValue="Av. Paulista, 1000 - São Paulo/SP" /></Field>
              </div>
              <LogoUpload />
              <div><Button onClick={save}>Salvar alterações</Button></div>
            </>
          )}

          {section === 'perfil' && (
            <>
              <h2 className="text-lg font-semibold">Perfil</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome" htmlFor="nome"><Input id="nome" defaultValue={currentUser.fullName} /></Field>
                <Field label="E-mail" htmlFor="p-email"><Input id="p-email" defaultValue={currentUser.email} /></Field>
              </div>
              <LogoUpload label="Foto" />
              <h3 className="border-t pt-5 font-semibold">Alterar senha</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nova senha" htmlFor="new-pw"><Input id="new-pw" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
                <Field label="Confirmar nova senha" htmlFor="conf-pw" error={pwError}><Input id="conf-pw" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
              </div>
              <div>
                <Button onClick={() => {
                  if (pw.next.length < 8) return setPwError('A senha deve ter ao menos 8 caracteres.')
                  if (pw.next !== pw.confirm) return setPwError('As senhas não coincidem.')
                  setPwError(''); setPw({ next: '', confirm: '' }); toast('Senha alterada com sucesso.')
                }}>Atualizar perfil</Button>
              </div>
            </>
          )}

          {section === 'orcamento' && (
            <>
              <h2 className="text-lg font-semibold">Personalização de orçamento</h2>
              <LogoUpload />
              <Field label="Informações exibidas no PDF" htmlFor="pdf-info">
                <Textarea id="pdf-info" defaultValue="Acme Serviços Ltda. · CNPJ 12.345.678/0001-90 · (11) 3000-0000" />
              </Field>
              <Field label="Condições comerciais padrão" htmlFor="pdf-terms">
                <Textarea id="pdf-terms" defaultValue="Validade de 15 dias. Pagamento: 50% na aprovação e 50% na entrega." />
              </Field>
              <div><Button onClick={save}>Salvar alterações</Button></div>
            </>
          )}

          {section === 'plano' && (
            <>
              <h2 className="text-lg font-semibold">Plano e utilização</h2>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div><p className="text-muted-foreground text-xs">Plano atual</p><p className="font-semibold">{planUsage.plan}</p></div>
                <p className="text-sm">{planUsage.used} de {planUsage.limit} orçamentos no mês</p>
              </div>
              <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="bg-secondary h-2 overflow-hidden rounded-full">
                <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
              </div>
              <h3 className="font-semibold">Histórico de utilização</h3>
              <ul className="divide-y text-sm">
                {planUsage.history.map((h) => <li key={h.month} className="flex justify-between py-2"><span>{h.month}</span><span>{h.used} orçamentos</span></li>)}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
