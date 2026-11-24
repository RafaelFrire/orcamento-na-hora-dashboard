import { AlertTriangle, Sparkles } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { useApi } from '@/hooks/useApi'
import { planService, type PlanUsage } from '@/services/plan'

/** Avisa do teste grátis e de cotas quase esgotadas; some quando está tudo tranquilo. */
function planNotice(plan: PlanUsage) {
  const { quotes } = plan
  const quotesLeft = Math.max(0, quotes.limit - quotes.used)

  if (plan.expired) {
    return { tone: 'danger' as const, text: 'Seu período de teste terminou. Escolha um plano para voltar a gerar orçamentos.' }
  }
  if (quotesLeft === 0) {
    return {
      tone: 'danger' as const,
      text: `Você usou os ${quotes.limit} orçamentos do plano ${plan.label}. Faça upgrade para continuar gerando.`,
    }
  }
  const ai = plan.aiDrafts
  if (ai && ai.used >= ai.limit) {
    return { tone: 'warning' as const, text: `Você usou os ${ai.limit} rascunhos com IA do plano ${plan.label}. O preenchimento manual continua disponível.` }
  }
  if (plan.plan === 'TRIAL') {
    const days = plan.daysLeft ?? 0
    return {
      tone: 'info' as const,
      text: `Teste grátis: ${quotes.used}/${quotes.limit} orçamentos · ${days} ${days === 1 ? 'dia restante' : 'dias restantes'}.`,
    }
  }
  if (quotes.used / quotes.limit >= 0.8) {
    return {
      tone: 'warning' as const,
      text: `Plano ${plan.label}: ${quotes.used}/${quotes.limit} orçamentos usados neste ciclo.`,
    }
  }
  return null
}

const toneClass = {
  info: 'bg-accent text-foreground',
  warning: 'bg-warning/15 text-foreground',
  danger: 'bg-destructive/10 text-destructive',
}

export function PlanBanner() {
  // Rebusca a cada navegação: o uso muda depois de gerar um orçamento.
  const { pathname } = useLocation()
  const { data } = useApi(() => planService.get(), [pathname])
  const notice = data ? planNotice(data) : null
  if (!notice) return null

  const Icon = notice.tone === 'info' ? Sparkles : AlertTriangle
  return (
    <div role="status" className={`flex items-center gap-2 px-8 py-2 text-sm ${toneClass[notice.tone]}`}>
      <Icon className="size-4 shrink-0" />
      <span>{notice.text}</span>
    </div>
  )
}
