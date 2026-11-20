export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'draft'

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  company?: string
  document?: string
  city?: string
  createdAt: string
}

export interface CatalogItem {
  id: string
  name: string
  description: string
  category: string
  unit: string
  price: number
  active: boolean
}

export interface QuoteItem {
  id: string
  catalogId?: string
  name: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
}

export interface Quote {
  id: string
  number: string
  clientId: string
  createdAt: string
  validUntil: string
  status: QuoteStatus
  items: QuoteItem[]
  discount: number
  paymentTerms: string
  notes: string
}

export interface Conversation {
  id: string
  clientId: string
  lastMessage: string
  time: string
  unread: number
  messages: { id: string; from: 'me' | 'them'; text: string; time: string }[]
}
