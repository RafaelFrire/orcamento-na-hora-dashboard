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

// --- Módulo futuro (Conversas): ainda sem API, usa dados de exemplo. ---
export interface Conversation {
  id: string
  clientId: string
  lastMessage: string
  time: string
  unread: number
  messages: { id: string; from: 'me' | 'them'; text: string; time: string }[]
}
