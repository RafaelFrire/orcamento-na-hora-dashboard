import { CheckCircle2, Info, Loader2, MessageCircle, Send, FileText, Smartphone } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

export default function WhatsAppPage() {
  const toast = useToast()
  const [state, setState] = useState<'off' | 'connecting' | 'on'>('off')
  const [confirm, setConfirm] = useState(false)

  function connect() {
    setState('connecting')
    setTimeout(() => {
      setState('on')
      toast('WhatsApp conectado com sucesso.')
    }, import.meta.env.MODE === 'test' ? 0 : 1200)
  }

  return (
    <>
      <PageHeader title="WhatsApp" description="Envie seus orçamentos direto para o cliente" />

      <div className="bg-accent mb-5 flex items-start gap-3 rounded-lg border p-4 text-sm">
        <Info className="text-primary mt-0.5 size-4 shrink-0" />
        <p>
          <strong>No MVP, o compartilhamento é manual:</strong> ao clicar em “Compartilhar pelo WhatsApp”, abrimos o
          WhatsApp com o orçamento pronto para você enviar. A leitura automática de conversas e a sincronização ainda
          <strong> não estão disponíveis</strong>.
        </p>
      </div>

      {state !== 'on' ? (
        <Card className="items-center gap-4 p-12 text-center">
          <div className="bg-success/15 text-success flex size-16 items-center justify-center rounded-full">
            <MessageCircle className="size-8" />
          </div>
          <h2 className="text-xl font-semibold">Conecte seu WhatsApp</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Vincule o número da sua empresa para compartilhar orçamentos com poucos cliques e manter tudo
            organizado em um só lugar.
          </p>
          <Button onClick={connect} disabled={state === 'connecting'}>
            {state === 'connecting' && <Loader2 className="size-4 animate-spin" />} Conectar WhatsApp
          </Button>
          <ol className="mt-4 grid max-w-2xl grid-cols-3 gap-4 text-left text-sm">
            {[
              [Smartphone, 'Conecte o número', 'Autorize o número da empresa.'],
              [FileText, 'Gere o orçamento', 'Monte a proposta e baixe o PDF.'],
              [Send, 'Compartilhe', 'Envie para o cliente pelo WhatsApp.'],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof Send
              return (
                <li key={i} className="rounded-lg border p-4">
                  <I className="text-primary mb-2 size-5" />
                  <p className="font-medium">{t as string}</p>
                  <p className="text-muted-foreground text-xs">{d as string}</p>
                </li>
              )
            })}
          </ol>
        </Card>
      ) : (
        <Card className="gap-5 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-success/15 text-success flex size-12 items-center justify-center rounded-full"><CheckCircle2 className="size-6" /></span>
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  Conexão ativa <span className="bg-success size-2 animate-pulse rounded-full" />
                </p>
                <p className="text-muted-foreground text-sm">Pronto para compartilhar orçamentos.</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setConfirm(true)}>Desconectar</Button>
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t pt-5 text-sm">
            <div><dt className="text-muted-foreground">Número conectado</dt><dd className="font-medium">+55 (11) 98765-0000</dd></div>
            <div><dt className="text-muted-foreground">Nome da conta</dt><dd className="font-medium">Acme Serviços</dd></div>
          </dl>
          <p className="text-muted-foreground text-xs">Sincronização de conversas: em breve.</p>
        </Card>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Desconectar WhatsApp?"
        description="Você poderá reconectar a qualquer momento."
        confirmLabel="Desconectar"
        onConfirm={() => { setState('off'); toast('WhatsApp desconectado.') }}
      />
    </>
  )
}
