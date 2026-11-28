import {
  FileCog,
  FileText,
  MessageCircle,
  Package,
  PartyPopper,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'

/** Evento para reabrir o tour (botão "Tour" no cabeçalho). */
export const OPEN_TOUR_EVENT = 'open-product-tour'

interface Step {
  title: string
  text: string
  icon: LucideIcon
  /** Página relacionada, aberta pelo botão "Ver agora". */
  to?: string
  toLabel?: string
}

const steps: Step[] = [
  {
    icon: PartyPopper,
    title: 'Bem-vindo ao Orçamento na Hora',
    text: 'Em 1 minuto você vê como montar e enviar orçamentos profissionais. Os passos abaixo seguem a ordem ideal para começar.',
  },
  {
    icon: Package,
    title: '1. Cadastre seu catálogo',
    text: 'Em Catálogo você registra os produtos e serviços com preço. Eles são a base dos orçamentos. Dá para importar um modelo pronto para o seu nicho.',
    to: '/catalogo',
    toLabel: 'Abrir Catálogo',
  },
  {
    icon: Users,
    title: '2. Cadastre seus clientes',
    text: 'Em Clientes ficam nome, telefone, e-mail e endereço. Ao montar um orçamento você escolhe o cliente e os dados já vêm preenchidos.',
    to: '/clientes',
    toLabel: 'Abrir Clientes',
  },
  {
    icon: FileText,
    title: '3. Crie um orçamento',
    text: 'Em Orçamentos, clique em "Novo orçamento", escolha o cliente e adicione itens do catálogo. Você também pode descrever o serviço em texto ou áudio e a IA preenche o rascunho para você revisar.',
    to: '/orcamentos/novo',
    toLabel: 'Criar orçamento',
  },
  {
    icon: MessageCircle,
    title: '4. Conecte o WhatsApp',
    text: 'Em WhatsApp você conecta seu número. Depois, as conversas dos clientes aparecem em Conversas e você envia o orçamento (PDF) direto pelo chat.',
    to: '/whatsapp',
    toLabel: 'Conectar WhatsApp',
  },
  {
    icon: FileCog,
    title: '5. Personalize seus documentos',
    text: 'Em Documentos você coloca sua logo, cores e textos do PDF. Pronto: é só acompanhar o status dos orçamentos (enviado, aprovado, recusado) pelo Dashboard.',
    to: '/documentos',
    toLabel: 'Abrir Documentos',
  },
]

function storageKey(userId: string) {
  return `product-tour-done:${userId}`
}

function readDone(userId: string) {
  try {
    return localStorage.getItem(storageKey(userId)) === '1'
  } catch {
    return false
  }
}

export function ProductTour() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  // Abre sozinho na primeira vez em que o usuário entra no sistema.
  useEffect(() => {
    if (userId && !readDone(userId)) setOpen(true)
  }, [userId])

  useEffect(() => {
    const reopen = () => {
      setIndex(0)
      setOpen(true)
    }
    window.addEventListener(OPEN_TOUR_EVENT, reopen)
    return () => window.removeEventListener(OPEN_TOUR_EVENT, reopen)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    if (!userId) return
    try {
      localStorage.setItem(storageKey(userId), '1')
    } catch {
      /* armazenamento indisponível: o tour pode reaparecer */
    }
  }, [userId])

  const step = steps[index]
  const last = index === steps.length - 1
  const Icon = step.icon

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      title={step.title}
      description={`Passo ${index + 1} de ${steps.length}`}
      footer={
        <>
          {!last && (
            <Button variant="ghost" className="mr-auto" onClick={close}>
              Pular tour
            </Button>
          )}
          {index > 0 && (
            <Button variant="outline" onClick={() => setIndex(index - 1)}>
              Voltar
            </Button>
          )}
          <Button onClick={() => (last ? close() : setIndex(index + 1))}>{last ? 'Concluir' : 'Próximo'}</Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-6" />
        </span>
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">{step.text}</p>
          {step.to && (
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => {
                close()
                navigate(step.to!)
              }}
            >
              {step.toLabel} →
            </Button>
          )}
        </div>
      </div>
      <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={i === index ? 'bg-primary h-1.5 w-5 rounded-full' : 'bg-border h-1.5 w-1.5 rounded-full'} />
        ))}
      </div>
    </Modal>
  )
}
