import type { CatalogItem, Category, Paginated, Segment } from '@/types'

import { http, orgPath } from './api'

export interface CatalogItemInput {
  segmentId: string
  categoryId?: string | null
  name: string
  description?: string
  basePrice: string
  unit: string
  /** Quantidade padrão (ou null para remover). */
  defaultQuantity?: string | null
  active?: boolean
}

export interface TemplatePackSummary {
  key: string
  name: string
  description: string
  segmentName: string
  itemCount: number
  categories: Array<{ name: string; count: number }>
}

export interface TemplatePackItem {
  key: string
  category: string
  name: string
  description: string
  unit: string
  price: string
}

export interface TemplateImportResult {
  segment: { id: string; name: string }
  created: number
  skipped: string[]
}

export const catalogService = {
  items: (query: { page?: number; pageSize?: number; q?: string; segmentId?: string; categoryId?: string; active?: boolean } = {}) =>
    http.get<Paginated<CatalogItem>>(orgPath('/catalog/items'), query),
  createItem: async (input: CatalogItemInput) =>
    (await http.post<{ item: CatalogItem }>(orgPath('/catalog/items'), input)).item,
  updateItem: async (id: string, input: Partial<CatalogItemInput>) =>
    (await http.patch<{ item: CatalogItem }>(orgPath(`/catalog/items/${id}`), input)).item,
  deleteItem: (id: string) => http.delete<void>(orgPath(`/catalog/items/${id}`)),

  segments: () => http.get<Paginated<Segment>>(orgPath('/catalog/segments'), { pageSize: 100 }),
  createSegment: async (name: string) =>
    (await http.post<{ segment: Segment }>(orgPath('/catalog/segments'), { name })).segment,
  templates: async () => (await http.get<{ data: TemplatePackSummary[] }>(orgPath('/catalog/templates'))).data,
  template: async (key: string) =>
    (await http.get<{ pack: TemplatePackSummary & { items: TemplatePackItem[] } }>(orgPath(`/catalog/templates/${key}`))).pack,
  importTemplate: (key: string, items: Array<{ key: string; basePrice: string }>) =>
    http.post<TemplateImportResult>(orgPath(`/catalog/templates/${key}/import`), { items }),
  categories: () => http.get<Paginated<Category>>(orgPath('/catalog/categories'), { pageSize: 100 }),
}
