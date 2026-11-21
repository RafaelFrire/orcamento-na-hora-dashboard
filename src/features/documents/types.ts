export type TemplateCategory = 'servicos' | 'orcamento' | 'contrato'

export type TemplateKind = 'price-table' | 'quote' | 'contract' | 'terms' | 'warranty' | 'receipt' | 'custom'

export interface ContentSection {
  id: string
  heading: string
  body: string
}

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  kind: TemplateKind
  /** Templates do sistema não podem ser excluídos, apenas duplicados. */
  builtIn: boolean
  title: string
  sections: ContentSection[]
}

export type StylePreset = 'minimalista' | 'moderno' | 'corporativo' | 'premium' | 'classico'

export type FontKey = 'inter' | 'playfair' | 'montserrat' | 'georgia' | 'arial'

export interface Branding {
  logo: string | null
  tradeName: string
  legalName: string
  cnpj: string
  phone: string
  whatsapp: string
  email: string
  address: string
  website: string
  primary: string
  secondary: string
  accent: string
  font: FontKey
  style: StylePreset
}

export interface DocumentSettings {
  format: 'A4'
  orientation: 'portrait' | 'landscape'
  showLogo: boolean
  showCompany: boolean
  headerText: string
  footerText: string
  pageNumbers: boolean
  issueDate: boolean
  signature: boolean
  defaultNotes: string
  defaultTerms: string
}

export interface DocumentConfig {
  branding: Branding
  settings: DocumentSettings
  templates: DocumentTemplate[]
  defaults: Record<TemplateCategory, string>
  selectedId: string
}

export interface QuoteItem {
  category: string
  name: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
  /** Preço "a partir de" na tabela de serviços. */
  from?: boolean
}

export interface SampleData {
  clientName: string
  clientDocument: string
  clientAddress: string
  quoteNumber: string
  items: QuoteItem[]
  discountPercent: number
}
