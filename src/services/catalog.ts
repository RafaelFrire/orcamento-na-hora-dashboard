import type { CatalogItem, Category, Paginated, Segment } from '@/types'

import { http, orgPath } from './api'

export interface CatalogItemInput {
  segmentId: string
  categoryId?: string | null
  name: string
  description?: string
  basePrice: string
  unit: string
  active?: boolean
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
  categories: () => http.get<Paginated<Category>>(orgPath('/catalog/categories'), { pageSize: 100 }),
}
