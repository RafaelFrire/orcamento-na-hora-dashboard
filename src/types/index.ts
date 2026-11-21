// Tipos alinhados aos contratos da API (../orcamento-na-hora).
// Valores monetários e quantidades chegam como string decimal ("1234.50").

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface User {
  id: string
  name: string
  email: string
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

export interface Quote {
  id: string
  number: number
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
}
