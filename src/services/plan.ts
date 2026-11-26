import { http, orgPath } from './api'

export type PlanKey = 'TRIAL' | 'START' | 'PROFESSIONAL' | 'BUSINESS'

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELING' | 'EXPIRED'

export interface PlanUsage {
  plan: PlanKey
  label: string
  /** Trial vencido: criação de orçamentos e novos usuários ficam bloqueados. */
  expired: boolean
  subscription?: { status: SubscriptionStatus; currentPeriodEnd: string | null; graceEndsAt: string | null } | null
  trialEndsAt: string | null
  daysLeft: number | null
  periodStart: string
  quotes: { used: number; limit: number }
  users: { used: number; limit: number }
  aiDrafts?: { used: number; limit: number }
  catalogItems?: { used: number; limit: number }
  /** Itens do catálogo enviados à IA por rascunho neste plano. */
  aiCatalogItems?: number
}

/** Plano à venda, como devolvido por `GET /plans`. */
export interface PlanOffer {
  key: Exclude<PlanKey, 'TRIAL'>
  label: string
  priceCents: number
  tagline: string
  recommended: boolean
  limits: { users: number; quotes: number; aiDrafts: number; catalogItems: number }
  features: string[]
}

export const planService = {
  get: () => http.get<PlanUsage>(orgPath('/plan')),
  offers: () => http.get<PlanOffer[]>('/plans'),
  /** Inicia a assinatura; devolve o link do checkout do Mercado Pago. */
  checkout: (plan: PlanOffer['key']) => http.post<{ checkoutUrl: string }>(orgPath('/subscription/checkout'), { plan }),
}
