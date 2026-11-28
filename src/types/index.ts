// Tipos alinhados aos contratos da API (../orcamento-na-hora).
// Valores monetários e quantidades chegam como string decimal ("1234.50").

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface User {
  id: string
  name: string
  email: string
  /** Admin da plataforma: cria empresas e atende chamados (área /admin). */
  isPlatformAdmin?: boolean
}

export interface Membership {
  organizationId: string
  name: string
  slug: string
  /** Segmento escolhido no cadastro (chave do modelo de catálogo). */
  niche?: string | null
  role: MemberRole
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  pagination: Pagination
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  createdAt: string
}

export interface Segment {
  id: string
  name: string
  active: boolean
}

export interface Category {
  id: string
  segmentId: string
  name: string
  active: boolean
}

export interface CatalogItem {
  id: string
  segmentId: string
  categoryId: string | null
  name: string
  description: string | null
  basePrice: string
  unit: string
  /** Quantidade usada quando o pedido não informa (ex.: brinquedo = 4 horas). */
  defaultQuantity?: string | null
  active: boolean
  segment?: { id: string; name: string }
  category?: { id: string; name: string } | null
}

export interface QuoteTemplate {
  companyName: string
  document: string | null
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  primaryColor: string
  commercialTerms: string | null
  footerText: string | null
  validityDays: number
  isDefault?: boolean
}

export interface QuoteItem {
  id: string
  position: number
  catalogItemId: string | null
  name: string
  description: string | null
  unit: string
  quantity: string
  catalogUnitPrice: string
  unitPrice: string
  subtotal: string
}

/** Cancelar não apaga: o orçamento fica registrado e sai das métricas. */
export type QuoteStatus = 'ACTIVE' | 'CANCELED'
/** Retorno do cliente: PENDING até o vendedor registrar fechou (WON) ou não (LOST). */
export type QuoteOutcome = 'PENDING' | 'WON' | 'LOST'
export type QuoteCancelCategory = 'WRONG_QUOTE' | 'DUPLICATE' | 'CUSTOMER_REQUEST' | 'OTHER'

export type StatsPeriod = 'day' | 'week' | 'month' | 'year'

export interface StatsBucket {
  key: string
  label: string
  /** Orçamentos ativos (cancelados ficam de fora). */
  count: number
  value: number
  wonCount: number
  wonValue: number
  lostCount: number
  lostValue: number
  pendingCount: number
  pendingValue: number
  canceledCount: number
  canceledValue: number
}

export interface QuoteStats {
  period: StatsPeriod
  from: string
  buckets: StatsBucket[]
  totals: StatsBucket
  /** Fechados ÷ (fechados + não fechados); null enquanto ninguém respondeu. */
  closeRate: number | null
  /** Cancelados ÷ emitidos no período. */
  cancelRate: number | null
  cancellations: {
    byCategory: { category: QuoteCancelCategory; count: number; value: number }[]
    recent: {
      id: string
      number: number
      customerName: string
      total: string
      canceledAt: string | null
      category: QuoteCancelCategory | null
      reason: string | null
    }[]
  }
}

export interface Quote {
  id: string
  number: number
  status: QuoteStatus
  outcome: QuoteOutcome
  outcomeAt: string | null
  canceledAt: string | null
  cancelCategory: QuoteCancelCategory | null
  cancelReason: string | null
  customerId: string
  customer: { id: string; name: string; phone: string | null; email: string | null }
  notes: string | null
  total: string
  createdAt: string
  validUntil: string | null
  issuer: QuoteTemplate | null
  /** Presente na listagem. */
  itemsCount?: number
  /** Presente no detalhe e na criação. */
  items?: QuoteItem[]
}

export interface WhatsappShare {
  phone: string | null
  filename: string
  message: string
  url: string
}

// --- WhatsApp (Cloud API via backend) ---
export interface WhatsappConnection {
  connected: boolean
  phoneNumberId?: string
  wabaId?: string
  displayPhone?: string | null
  verifiedName?: string | null
  /** 'INVALID' quando a Meta recusou o token (expirado, revogado ou sem permissão). Ausente = sem problema conhecido. */
  tokenStatus?: 'OK' | 'INVALID'
  webhook: { path: string; verifyTokenConfigured: boolean; appSecretConfigured: boolean }
}

export type ConversationCustomer = Pick<Customer, 'id' | 'name' | 'phone' | 'email'>

export interface Conversation {
  id: string
  waContactId: string
  contactName: string | null
  lastMessageAt: string
  lastMessageText: string | null
  unreadCount: number
  customer: ConversationCustomer | null
}

export type MessageStatus = 'RECEIVED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export interface Message {
  id: string
  direction: 'IN' | 'OUT'
  type: string
  body: string | null
  status: MessageStatus
  errorMessage: string | null
  sentAt: string
  hasMedia: boolean
  mediaMime: string | null
  mediaName: string | null
  /** Texto do áudio (voz → texto); null enquanto não transcrito. */
  transcript?: string | null
}

// --- Rascunho de orçamento com IA ---
// A IA nunca devolve preço: o valor de cada item vem do catálogo.
export interface AiDraftItem {
  catalogItemId: string
  name: string
  /** null quando não há como saber (o dono preenche). */
  quantity: string | null
  /** stated: dita · inferred: herdada do pedido · default: padrão do item · missing: falta informar. */
  quantitySource: 'stated' | 'inferred' | 'default' | 'missing'
  unit: string
  confidence: number
  sourceText: string
}

export interface AiDraftUnmatched {
  text: string
  reason: 'NO_CATALOG_MATCH'
  /** Ids de itens do catálogo parecidos com o trecho. */
  suggestions: string[]
}

export interface AiQuoteDraft {
  customer: {
    status: 'matched' | 'suggested_new' | 'unknown'
    customerId: string | null
    name: string | null
    phone: string | null
    confidence: number
  }
  items: AiDraftItem[]
  unmatched: AiDraftUnmatched[]
  notes: string | null
  warnings: string[]
}
