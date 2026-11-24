import { http, orgPath } from './api'

export type PlanKey = 'TRIAL' | 'START' | 'MIDDLE' | 'HIGH'

export interface PlanUsage {
  plan: PlanKey
  label: string
  /** Trial vencido: criação de orçamentos e novos usuários ficam bloqueados. */
  expired: boolean
  trialEndsAt: string | null
  daysLeft: number | null
  periodStart: string
  quotes: { used: number; limit: number }
  users: { used: number; limit: number }
  aiDrafts?: { used: number; limit: number }
  /** Itens do catálogo enviados à IA por rascunho neste plano. */
  aiCatalogItems?: number
}

export const planService = {
  get: () => http.get<PlanUsage>(orgPath('/plan')),
}
